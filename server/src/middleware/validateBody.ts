import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';
import AppError from '../utils/AppError';

/**
 * Parses the request body with a zod schema and replaces it with the parsed value. Unknown
 * keys are stripped, so a handler can never write fields the schema does not list
 * (for example `isVerified`, `ownerId` or `projectId`) into the database.
 */
export const validateBody =
    (schema: ZodType) =>
    (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body ?? {});
        if (!result.success) {
            return next(new AppError(result.error.issues[0]?.message ?? 'Invalid request body', 400));
        }
        req.body = result.data;
        next();
    };
