import rateLimit from 'express-rate-limit';

const tooManyRequests = (message: string) => ({
    success: false,
    message,
});

export const rateLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
    message: tooManyRequests('Too many requests from this IP, please try again later'),
    standardHeaders: true,
    legacyHeaders: false,
});

// Brute-force protection for login, register and password reset. Successful requests are not
// counted, so a legitimate user is never locked out by their own sign-ins.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10'),
    skipSuccessfulRequests: true,
    message: tooManyRequests('Too many authentication attempts, please try again later'),
    standardHeaders: true,
    legacyHeaders: false,
});
