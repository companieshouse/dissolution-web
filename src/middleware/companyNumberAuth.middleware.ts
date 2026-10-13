import { NextFunction, Request, RequestHandler, Response } from "express";
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger";
import CompanyAuthService from "app/services/auth/companyAuth.service";
import { validateCompanyNumber } from "app/utils/companyNumber.util";
import { runAsync } from "app/utils/asyncHandler";
import { AuthOptions } from "@companieshouse/web-security-node";

export default function CompanyNumberAuthMiddleware(
    companyAuthService: CompanyAuthService,
    commonAuthMiddleware: (opts: AuthOptions) => RequestHandler,
    logger: ApplicationLogger
): RequestHandler {
    return runAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { companyNumber: companyNumberFromPath } = req.params;

        if (!companyNumberFromPath) {
            return next(new Error("No company number in path"));
        }

        const { companyNumber, error } = validateCompanyNumber(companyNumberFromPath);

        if (error || !companyNumber) {
            return next(new Error("Invalid company number in path"));
        }

        try {
            if (companyAuthService.isAuthorisedForCompany(req, companyNumber)) {
                logger.info(`[CompanyNumberAuthMiddleware] Authenticated user is authorized for ${companyNumber}`);
                return next();
            }
            logger.info(
                `[CompanyNumberAuthMiddleware] Authenticated user is not authorized for ${companyNumber}, redirecting to Enter Company Auth Code page`
            );
            const authOptions: AuthOptions = companyAuthService.configureAuthRedirect(req, companyNumber);
            return commonAuthMiddleware(authOptions)(req, res, next);
        } catch (error) {
            return next(error);
        }
    });
}
