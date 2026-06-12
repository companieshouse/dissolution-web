import { NextFunction, Request, RequestHandler, Response } from "express"

import SessionService from "app/services/session/session.service"

export default function SaveUserEmailToLocals (sessionService: SessionService): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (req.session) {
                res.locals.userEmail = sessionService.getUserEmail(req)
            }
            return next()
        } catch (error: unknown) {
            // This can happen but the session and auth middlewares should prevent a malformed session
            const message = error instanceof Error ? error.message : String(error)
            return next(new Error(`Malformed session: ${message}`))
        }
    }
}
