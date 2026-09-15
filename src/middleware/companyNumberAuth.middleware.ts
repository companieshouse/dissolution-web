import { NextFunction, Request, RequestHandler, Response } from "express";
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger";
import CompanyAuthService from "app/services/auth/companyAuth.service";
import { validateCompanyNumber } from "app/utils/companyNumber.util";

export default function CompanyNumberAuthMiddleware(
    companyAuthService: CompanyAuthService,
    logger: ApplicationLogger
): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        const { companyNumber: companyNumberFromPath } = req.params;

        if (!companyNumberFromPath) {
            return next(new Error("No company Number in path"));
        }

        const { companyNumber, error } = validateCompanyNumber(companyNumberFromPath);

        if (error || !companyNumber) {
            return next(new Error("Invalid company number in path"));
        }

        if (companyAuthService.isAuthorisedForCompany(req, companyNumber)) {
            logger.info(`Authenticated user is authorized for ${companyNumber}`);
            return next();
        } else {
            logger.info(
                `Authenticated user is not authorized for ${companyNumber}, redirecting to Enter Company Auth Code page`
            );
            const redirectUri = await companyAuthService.issueAuthRedirectUri(req, companyNumber);
            return res.redirect(redirectUri);
        }
    };
}
