import { clerkClient, verifyToken } from '@clerk/express';
import User from '../models/User.js';

export const VALID_DOMAINS = ['Machine Learning', 'Deep Learning', 'DAV', 'DSA', 'WebDev'];
export const ALLOWED_EMAIL_DOMAIN = '@learner.manipal.edu';

export const getPrimaryVerifiedEmail = (clerkUser) => {
  const primary = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  );
  if (!primary) return null;
  if (primary.verification?.status !== 'verified') return null;
  return primary.emailAddress;
};

export const verifyClerkToken = async (req) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    return null;
  }
  const token = req.headers.authorization.split(' ')[1];
  try {
    const verified = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      authorizedParties: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5000'],
      clockSkewInMs: 120000
    });
    return verified;
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return null;
  }
};

export const authenticateToken = async (req, res, next) => {
  try {
    const verifiedToken = await verifyClerkToken(req);
    if (!verifiedToken || !verifiedToken.sub) {
      return res.status(401).json({ message: 'Access token required or invalid session' });
    }
    const userId = verifiedToken.sub;

    const clerkUser = await clerkClient.users.getUser(userId);
    const verifiedEmail = getPrimaryVerifiedEmail(clerkUser);

    if (!verifiedEmail) {
      return res.status(403).json({
        message: 'Your email address has not been verified. Please verify your email before accessing the platform.',
        domainError: true
      });
    }

    if (!verifiedEmail.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN)) {
      console.warn(`Domain check failed for Clerk user ${userId} with email: ${verifiedEmail}`);
      return res.status(403).json({
        message: 'Only learner.manipal.edu accounts are allowed.',
        domainError: true
      });
    }

    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User profile not found. Onboarding required.', onboardingRequired: true });
    }

    req.user = user;
    req.authUserId = userId;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

export const requireDomainAccess = (getDomainParam = (req) => req.params.domain) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const domain = getDomainParam(req);

    if (req.user.role === 'super_admin') {
      return next();
    }

    if (req.user.role === 'admin' && req.user.adminDomains && req.user.adminDomains.includes(domain)) {
      return next();
    }

    return res.status(403).json({ message: `Access denied: you do not have admin rights for ${domain}` });
  };
};
