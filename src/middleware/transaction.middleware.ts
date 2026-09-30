import { NextFunction, Request, RequestHandler, Response } from "express";
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger";
import SessionService from "app/services/session/session.service";
import transactionIdSchema from "app/schemas/transactionId.schema";
import { runAsync } from "app/utils/asyncHandler";
import { BOOTSTRAP_JOURNEY_URI } from "app/paths";

export default function TransactionMiddleware(
    sessionService: SessionService,
    logger: ApplicationLogger
): RequestHandler {
    return runAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { transactionId: transactionIdFromPath } = req.params;

        if (!transactionIdFromPath) {
            return next();
        }

        try {
            const id = validateTransactionId(transactionIdFromPath);
            const companyNumber = sessionService.requireDissolutionCompanyNumber(req);
            const transactionId = sessionService.requireDissolutionTransactionId(req);

            if (id === transactionId) {
                return next();
            }
            logger.debug(
                `Transaction ID in path (${id}) does not match transaction ID in session (${transactionId}), redirecting to Bootstrap Journey page`
            );
            return res.redirect(buildRedirectUri(companyNumber));
        } catch (error) {
            return next(error);
        }
    });
}

function validateTransactionId(transactionId: string): string {
    const { value, error } = transactionIdSchema.validate(transactionId);

    if (error || !value) {
        throw new Error("Invalid transaction ID in path");
    }
    return value;
}

function buildRedirectUri(companyNumber: string): string {
    return `${BOOTSTRAP_JOURNEY_URI}?companyNumber=${encodeURIComponent(companyNumber)}`;
}
