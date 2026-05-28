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
    }
});

export default authLimiter;