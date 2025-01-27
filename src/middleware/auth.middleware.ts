import { AuthOptions } from "@companieshouse/web-security-node"
import { NextFunction, Request, RequestHandler, Response } from "express"
import UriFactory from "app/utils/uri.factory"

import {
    ROOT_URI,
    HEALTHCHECK_URI,
    WHO_TO_TELL_URI,
    ACCESSIBILITY_STATEMENT_URI
} from "app/paths"

const USER_AUTH_WHITELISTED_URLS: string[] = [
    ROOT_URI,
    `${ROOT_URI}/`,
    HEALTHCHECK_URI,
    `${HEALTHCHECK_URI}/`,
    ACCESSIBILITY_STATEMENT_URI,
    `${ACCESSIBILITY_STATEMENT_URI}/`
]

export default function AuthMiddleware (
    accountWebUrl: string, uriFactory: UriFactory, commonAuthMiddleware: (opts: AuthOptions) => RequestHandler
): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        if (isWhitelistedUrl(req.url)) {
            return next()
        }
        const authOptions: AuthOptions = {
            returnUrl: uriFactory.createAbsoluteUri(req, WHO_TO_TELL_URI),
            chsWebUrl: accountWebUrl
        }
        return commonAuthMiddleware(authOptions)(req, res, next)
    }
}

function isWhitelistedUrl (url: string): boolean {
    return USER_AUTH_WHITELISTED_URLS.includes(url)
}
