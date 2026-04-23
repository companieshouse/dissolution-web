import { Request, Response, NextFunction, RequestHandler } from "express"
import SessionService from "app/services/session/session.service"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import Optional from "app/models/optional"
import {JourneyExpiredError} from "app/errors/journeyExpired.error";

export default function JourneyIdAuthMiddleware(sessionService: SessionService): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const journeyId = req.params.journeyId
        const session: Optional<DissolutionSession> = sessionService.getDissolutionSession(req)
        if (!journeyId) {
            return next(new Error("No journeyId in request"))
        }
        if (!session?.journeyId) {
            return next(new Error("No journeyId in session"))
        }
        if (journeyId !== session.journeyId) {
            return next(new JourneyExpiredError("Journey expired - You can only file a dissolution for one company at a time"))
        }
        next()
    }
}
