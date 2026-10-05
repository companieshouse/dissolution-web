import "reflect-metadata";

import { Request } from "express";
import { provide } from "inversify-binding-decorators";
import { inject } from "inversify";
import TYPES from "app/types";

import AuthConfig from "app/models/authConfig";
import SessionService from "app/services/session/session.service";
import { BOOTSTRAP_JOURNEY_URI } from "app/paths";
import { SignInInfoKeys } from "@companieshouse/node-session-handler/lib/session/keys/SignInInfoKeys";
import { AuthOptions } from "@companieshouse/web-security-node";
import UriFactory from "app/utils/uri.factory";

@provide(CompanyAuthService)
export default class CompanyAuthService {
    public constructor(
        @inject(TYPES.AuthConfig) private readonly authConfig: AuthConfig,
        @inject(SessionService) private readonly sessionService: SessionService,
        @inject(UriFactory) private readonly uriFactory: UriFactory
    ) {}

    public isAuthorisedForCompany(req: Request, companyNumber?: string): boolean {
        if (!companyNumber) {
            return false;
        }
        const signInInfo = this.sessionService.getSignInInfo(req);
        return signInInfo[SignInInfoKeys.CompanyNumber] === companyNumber;
    }

    public configureAuthRedirect(req: Request, companyNumber: string): AuthOptions {
        return {
            chsWebUrl: this.authConfig.chsUrl,
            returnUrl: this.uriFactory.createAbsoluteUri(
                req,
                `${BOOTSTRAP_JOURNEY_URI}?companyNumber=${encodeURIComponent(companyNumber)}`
            ),
            companyNumber,
        };
    }
}
