import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import AppError from '../utils/AppError';

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Expected client errors (bad input, auth failures) are warnings; only real faults are errors.
    if (err instanceof AppError && err.statusCode < 500) {
        logger.warn(`${err.statusCode} ${err.message}`);
    } else {
        logger.error('Unhandled error', err);
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    // Default error
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};
