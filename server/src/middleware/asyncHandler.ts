import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => unknown;

export const asyncHandler = (fn: AsyncRoute): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
