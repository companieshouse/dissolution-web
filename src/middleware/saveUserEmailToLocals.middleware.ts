import { NextFunction, Request, RequestHandler, Response } from 'express'

import SessionService from 'app/services/session/session.service'

export default function SaveUserEmailToLocals(sessionService: SessionService): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.session) {
      res.locals.userEmail = sessionService.getUserEmail(req)
    }

    return next()
  }
}
