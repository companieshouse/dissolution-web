import { Request, Response, NextFunction, RequestHandler } from "express";

export type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * A reusable wrapper function that wraps an async route handler or middleware.
 * This is useful as Express 4 expects handlers to match the `RequestHandler` type, which returns `void`.
 * Additionally, Express 4 does not handle rejected Promises.
 * If an async handler throws, the error is never passed to Express's error-handling middleware.
 * This can cause an unhandled rejection, and the request may hang.
 *
 * This wrapper returns a standard `RequestHandler`, and safely handles any rejection from
 * the wrapped async handler so Express's error handlers receive it.
 *
 * @param fn - The async handler to wrap.
 * @returns A `RequestHandler` that Express can register.
 */
export const runAsync = (fn: AsyncRequestHandler): RequestHandler => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
