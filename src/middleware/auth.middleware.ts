import { NextFunction, Request, RequestHandler, Response } from 'express'
import { AuthOptions } from 'web-security-node'

import { HEALTHCHECK_URI, ROOT_URI, SEARCH_COMPANY_URI, WHO_TO_TELL_URI } from 'app/paths'
import UriFactory from 'app/utils/uri.factory'

const USER_AUTH_WHITELISTED_URLS: string[] = [
  `${ROOT_URI}/`,
  WHO_TO_TELL_URI,
  HEALTHCHECK_URI
]

export default function AuthMiddleware(
  accountWebUrl: string, uriFactory: UriFactory, commonAuthMiddleware: (opts: AuthOptions) => RequestHandler
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (isWhitelistedUrl(req.url)) {
      return next()
    }

    const authOptions: AuthOptions = {
      returnUrl: uriFactory.createAbsoluteUri(req, SEARCH_COMPANY_URI),
      accountWebUrl
    }

    return commonAuthMiddleware(authOptions)(req, res, next)
  }
}

function isWhitelistedUrl(url: string): boolean {
  return USER_AUTH_WHITELISTED_URLS.includes(url)
}
