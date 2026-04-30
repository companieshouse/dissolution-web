import {NextFunction, Request, RequestHandler, Response} from "express"
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger"
import CompanyAuthService from "app/services/auth/companyAuth.service"
import SessionService from "app/services/session/session.service"

import {
    ACCESSIBILITY_STATEMENT_URI, BOOTSTRAP_JOURNEY_URI,
    HEALTHCHECK_URI,
    ROOT_URI,
    SEARCH_COMPANY_URI,
    STOP_SCREEN_BANK_ACCOUNT_URI,
    WHO_TO_TELL_URI
} from "app/paths"


const COMPANY_AUTH_WHITELISTED_URLS: string[] = [
    ROOT_URI,
    `${ROOT_URI}/`,
    WHO_TO_TELL_URI,
    `${WHO_TO_TELL_URI}/`,
    HEALTHCHECK_URI,
    `${HEALTHCHECK_URI}/`,
    SEARCH_COMPANY_URI,
    `${SEARCH_COMPANY_URI}/`,
    STOP_SCREEN_BANK_ACCOUNT_URI,
    `${STOP_SCREEN_BANK_ACCOUNT_URI}/`,
    ACCESSIBILITY_STATEMENT_URI,
    `${ACCESSIBILITY_STATEMENT_URI}/`,
    BOOTSTRAP_JOURNEY_URI,
    `${BOOTSTRAP_JOURNEY_URI}/`,
]


export default function CompanyAuthMiddleware (
    companyAuthService: CompanyAuthService, sessionService: SessionService, logger: ApplicationLogger
): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {

        if (isWhitelistedUrl(req.path)) {
            return next()
        }

        const companyNumber = sessionService.getDissolutionCompanyNumber(req)

        if (!companyNumber) {
            return next(new Error("No Company Number in session"))
        }

        if (companyAuthService.isAuthorisedForCompany(req, companyNumber)) {
            logger.info(`Authenticated user is authorized for ${companyNumber}`)
            return next()
        } else {
            logger.info(`Authenticated user is not authorized for ${companyNumber}, redirecting to Enter Company Auth Code page`)
            return res.redirect(await companyAuthService.getAuthRedirectUri(req, companyNumber))
        }
    }
}

export function isWhitelistedUrl (url: string): boolean {
    return COMPANY_AUTH_WHITELISTED_URLS.includes(url)
}
