import { NextFunction, Request, RequestHandler, Response } from 'express'
import { AuthOptions } from 'web-security-node'

import { SEARCH_COMPANY_URI } from 'app/paths'
import UriFactory from 'app/utils/uri.factory'

export default function AuthMiddleware(accountWebUrl: string, uriFactory: UriFactory,
                                       commonAuthMiddleware: (opts: AuthOptions) => RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const authOptions: AuthOptions = {
      returnUrl: uriFactory.createAbsoluteUri(req, SEARCH_COMPANY_URI),
      accountWebUrl
    }

    return commonAuthMiddleware(authOptions)(req, res, next)
  }
}