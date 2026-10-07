import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthOptions } from "@companieshouse/web-security-node";
import CompanyAuthService from "app/services/auth/companyAuth.service";
import { validateCompanyNumber } from "app/utils/companyNumber.util";

export default function BootstrapJourneyAuthMiddleware(
    companyAuthService: CompanyAuthService,
    commonAuthMiddleware: (opts: AuthOptions) => RequestHandler
): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const { companyNumber, error } = validateCompanyNumber(req.query.companyNumber as string | string[]);

        if (error || !companyNumber) {
            return next(new Error("Invalid company number"));
        }

        try {
            if (companyAuthService.isAuthorisedForCompany(req, companyNumber)) {
                return next();
            }
            const authOptions: AuthOptions = companyAuthService.configureAuthRedirect(req, companyNumber);
            return commonAuthMiddleware(authOptions)(req, res, next);
        } catch (error) {
            return next(error);
        }
    };
}
