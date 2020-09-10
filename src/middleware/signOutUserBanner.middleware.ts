import { NextFunction, Request, RequestHandler, Response } from 'express'

import SessionService from 'app/services/session/session.service'

export default function SignOutUserBannerMiddleware(sessionService: SessionService): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const userEmail: string = sessionService.getUserEmail(req)

    res.locals.userEmail = userEmail

    return next()
  }
}
