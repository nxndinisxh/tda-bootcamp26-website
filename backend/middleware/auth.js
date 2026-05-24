import jwt from 'jsonwebtoken';

// JWT Authentication Middleware
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

// Access Control Middlewares
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

    // Super Admin has access to everything
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Domain Admin must have access to this specific domain
    if (req.user.role === 'admin' && req.user.adminDomains && req.user.adminDomains.includes(domain)) {
      return next();
    }

    return res.status(403).json({ message: `Access denied: you do not have admin rights for ${domain}` });
  };
};
