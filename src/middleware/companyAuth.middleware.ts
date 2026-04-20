import {NextFunction, Request, RequestHandler, Response} from "express"
import {SignInInfoKeys} from "@companieshouse/node-session-handler/lib/session/keys/SignInInfoKeys"
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger"

import AuthConfig from "app/models/authConfig"
import Optional from "app/models/optional"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import JwtEncryptionService from "app/services/encryption/jwtEncryption.service"
import SessionService from "app/services/session/session.service"

import {
    ACCESSIBILITY_STATEMENT_URI,
    HEALTHCHECK_URI,
    ROOT_URI,
    SEARCH_COMPANY_URI,
    STOP_SCREEN_BANK_ACCOUNT_URI,
    WHO_TO_TELL_URI,
    BOOTSTRAP_JOURNEY_URI
} from "app/paths"

const OAUTH_COMPANY_SCOPE_PREFIX = "https://api.companieshouse.gov.uk/company/"
const OAUTH_USER_SCOPE = "https://account.companieshouse.gov.uk/user.write-full"

const COMPANY_AUTH_WHITELISTED_URLS: string[] = [
    ROOT_URI,
    `${ROOT_URI}/`,
    WHO_TO_TELL_URI,
    `${WHO_TO_TELL_URI}/`,
    HEALTHCHECK_URI,
    `${HEALTHCHECK_URI}/`,
    SEARCH_COMPANY_URI,
    STOP_SCREEN_BANK_ACCOUNT_URI,
    `${SEARCH_COMPANY_URI}/`,
    ACCESSIBILITY_STATEMENT_URI,
    `${ACCESSIBILITY_STATEMENT_URI}/`
]


export default function CompanyAuthMiddleware (
    authConfig: AuthConfig, encryptionService: JwtEncryptionService, sessionService: SessionService, logger: ApplicationLogger
): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (isWhitelistedUrl(req.url)) {
            return next()
        }

        const dissolutionSession = sessionService.getDissolutionSession(req)
        const companyNumber = getCompanyNumber(dissolutionSession, req)

        if (!companyNumber) {
            return next(new Error("No Company Number"))
        }

        if (isAuthorisedForCompany(companyNumber, sessionService, req)) {
            logger.info(`Authenticated user is authorized for ${companyNumber}`)
            return next()
        } else {
            logger.info(`Authenticated user is not authorized for ${companyNumber}, redirecting to Enter Company Auth Code page`)
            return res.redirect(await getAuthRedirectUri(req, authConfig, encryptionService, sessionService, companyNumber))
        }
    }
}

function getCompanyNumber (session: Optional<DissolutionSession>, req: Request): string | undefined {
    return (req.query.companyNumber as string | undefined) ?? session?.companyNumber
}

export function isWhitelistedUrl (url: string): boolean {
    return COMPANY_AUTH_WHITELISTED_URLS.includes(url)
}

function isAuthorisedForCompany (companyNumber: string, sessionService: SessionService, req: Request): boolean {
    const signInInfo = sessionService.getSignInInfo(req)
    return signInInfo[SignInInfoKeys.CompanyNumber] === companyNumber
}

function getBootstrapJourneyUrl(companyNumber: string): string {
    return `${BOOTSTRAP_JOURNEY_URI}?companyNumber=${encodeURIComponent(companyNumber)}`
}

async function getAuthRedirectUri (
    req: Request, authConfig: AuthConfig, encryptionService: JwtEncryptionService, sessionService: SessionService, companyNumber?: string
): Promise<string> {
    const originalUrl: string = getBootstrapJourneyUrl(companyNumber!)
    const scope: string = OAUTH_USER_SCOPE + " " + OAUTH_COMPANY_SCOPE_PREFIX + companyNumber
    const nonce: string = encryptionService.generateNonce()
    const encodedNonce: string = await encryptionService.jweEncodeWithNonce(originalUrl, nonce)

    sessionService.setCompanyAuthNonce(req, nonce)

    return await createAuthUri(encodedNonce, authConfig, scope)
}

async function createAuthUri (encodedNonce: string, authConfig: AuthConfig, scope: string): Promise<string> {
    return `${authConfig.accountUrl}/oauth2/authorise`.concat(
        "?",
        `client_id=${authConfig.accountClientId}`,
        `&redirect_uri=${authConfig.chsUrl}/oauth2/user/callback`,
        `&response_type=code`,
        `&scope=${scope}`,
        `&state=${encodedNonce}`)
}
