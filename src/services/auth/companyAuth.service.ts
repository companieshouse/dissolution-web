import "reflect-metadata"

import {Request} from "express"
import {provide} from "inversify-binding-decorators"
import {inject} from "inversify"
import TYPES from "app/types"

import AuthConfig from "app/models/authConfig"
import JwtEncryptionService from "app/services/encryption/jwtEncryption.service"
import SessionService from "app/services/session/session.service"
import {BOOTSTRAP_JOURNEY_URI} from "app/paths"
import {SignInInfoKeys} from "@companieshouse/node-session-handler/lib/session/keys/SignInInfoKeys"

const OAUTH_COMPANY_SCOPE_PREFIX = "https://api.companieshouse.gov.uk/company/"
const OAUTH_USER_SCOPE = "https://account.companieshouse.gov.uk/user.write-full"

@provide(CompanyAuthService)
export default class CompanyAuthService {
    public constructor(
        @inject(TYPES.AuthConfig) private readonly authConfig: AuthConfig,
        @inject(JwtEncryptionService) private readonly encryptionService: JwtEncryptionService,
        @inject(SessionService) private readonly sessionService: SessionService,
    ) {
    }

    public isAuthorisedForCompany(req: Request, companyNumber?: string): boolean {
        if (!companyNumber) {
            return false
        }
        const signInInfo = this.sessionService.getSignInInfo(req)
        return signInInfo[SignInInfoKeys.CompanyNumber] === companyNumber
    }

    public async getAuthRedirectUri(req: Request, companyNumber: string): Promise<string> {
        const originalUrl = `${BOOTSTRAP_JOURNEY_URI}?companyNumber=${encodeURIComponent(companyNumber)}`
        const scope = `${OAUTH_USER_SCOPE} ${OAUTH_COMPANY_SCOPE_PREFIX}${companyNumber}`

        const nonce: string = this.encryptionService.generateNonce()
        const encodedState: string = await this.encryptionService.jweEncodeWithNonce(originalUrl, nonce)

        this.sessionService.setCompanyAuthNonce(req, nonce)

        const params = new URLSearchParams({
            client_id: this.authConfig.accountClientId,
            redirect_uri: `${this.authConfig.chsUrl}/oauth2/user/callback`,
            response_type: "code",
            scope,
            state: encodedState
        })

        return `${this.authConfig.accountUrl}/oauth2/authorise?${params.toString()}`
    }
}

