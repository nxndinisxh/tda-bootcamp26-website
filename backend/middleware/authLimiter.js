import rateLimiter from 'express-rate-limit';

const authLimiter = rateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: `Too many login attempts, try again later.`
    },

    standardHeaders: true,
    legacyHeaders: false,

    validate: {
        keyGeneratorIpFallback: false
    },

    keyGenerator: (req) => {
        return req.headers['x-session-id'] || req.ip;
    },

    skip: (req) => {
        //if (process.env.VERCEL) return true;
        if (process.env.NODE_ENV === 'development') return true;
        const ip = req.ip || req.socket?.remoteAddress || '';
        return ip === '::1' || ip === '127.0.0.1' || ip.endsWith('127.0.0.1') || ip === '::ffff:127.0.0.1';
    }
});

export default authLimiter;