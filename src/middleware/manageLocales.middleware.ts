import { NextFunction, Request, RequestHandler, Response } from 'express'

export default function ManageLocales(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
    res.locals.currentUrl = currentUrl
    res.locals.htmlLang = 'cy'
    res.locals.pageTitleLang = 'cy'
    res.locals.mainLang = 'cy'

    return next()
  }
}
