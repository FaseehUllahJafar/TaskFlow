import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        // passport already declares Request.user as Express.User; describe our JWT payload on it.
        interface User {
            id: string;
            email: string;
            role?: string;
        }
    }
}

export type AuthRequest = Request;

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No token provided', 401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
            id: string;
            email: string;
        };

        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return next(new AppError('Token expired', 401));
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return next(new AppError('Invalid token', 401));
        }
        next(error);
    }
};
