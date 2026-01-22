import { NextFunction, Request, RequestHandler, Response } from "express"
import { SignInInfoKeys } from "@companieshouse/node-session-handler/lib/session/keys/SignInInfoKeys"
import { ISignInInfo } from "@companieshouse/node-session-handler/lib/session/model/SessionInterfaces"
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger"

import AuthConfig from "app/models/authConfig"
import Optional from "app/models/optional"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import JwtEncryptionService from "app/services/encryption/jwtEncryption.service"
import SessionService from "app/services/session/session.service"

import {
    ACCESSIBILITY_STATEMENT_URI,
    HEALTHCHECK_URI, ROOT_URI,
    SEARCH_COMPANY_URI,
    STOP_SCREEN_BANK_ACCOUNT_URI,
    VIEW_COMPANY_INFORMATION_URI,
    WHO_TO_TELL_URI
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
    VIEW_COMPANY_INFORMATION_URI,
    `${VIEW_COMPANY_INFORMATION_URI}/`,
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

        const dissolutionSession: Optional<DissolutionSession> = sessionService.getDissolutionSession(req)

        if (!dissolutionSession?.companyNumber) {
            return next(new Error("No Company Number in session"))
        }

        const companyNumber = dissolutionSession.companyNumber
        const signInInfo: ISignInInfo = sessionService.getSignInInfo(req)

        if (isAuthorisedForCompany(signInInfo, companyNumber)) {
            logger.info(`User is authenticated for ${companyNumber}`)
            return next()
        }

        logger.info(`User is not authenticated for ${companyNumber}, redirecting`)
        return res.redirect(await getAuthRedirectUri(req, authConfig, encryptionService, sessionService, companyNumber))
    }
}

function isWhitelistedUrl (url: string): boolean {
    return COMPANY_AUTH_WHITELISTED_URLS.includes(url)
}

function isAuthorisedForCompany (signInInfo: ISignInInfo, companyNumber: string): boolean {
    return signInInfo[SignInInfoKeys.CompanyNumber] === companyNumber
}

async function getAuthRedirectUri (
    req: Request, authConfig: AuthConfig, encryptionService: JwtEncryptionService, sessionService: SessionService, companyNumber?: string
): Promise<string> {
    const originalUrl: string = req.originalUrl
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
