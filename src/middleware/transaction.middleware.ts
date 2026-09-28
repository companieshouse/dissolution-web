import { NextFunction, Request, RequestHandler, Response } from "express";
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger";
import TransactionService from "app/services/transaction/transaction.service";
import SessionService from "app/services/session/session.service";
import transactionIdSchema from "app/schemas/transactionId.schema";
import Optional from "app/models/optional";
import DissolutionSession from "app/models/session/dissolutionSession.model";

export default function TransactionMiddleware(
    transactionService: TransactionService,
    sessionService: SessionService,
    logger: ApplicationLogger
): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const { transactionId: transactionIdFromPath } = req.params;

        if (!transactionIdFromPath) {
            return next();
        }

        const { value: transactionId, error } = transactionIdSchema.validate(transactionIdFromPath);

        if (error || !transactionId) {
            return next(new Error("Invalid transaction ID in path"));
        }

        const session: Optional<DissolutionSession> = sessionService.getDissolutionSession(req);

        if (!session?.transactionId) {
            return next(new Error("No transactionId in session"));
        }

        if (transactionId !== session.transactionId) {
            return transactionService
                .getTransaction(sessionService.getAccessToken(req), transactionId)
                .then(transaction => {
                    if (transaction.companyNumber !== session.companyNumber) {
                        logger.info(
                            `Transaction ${session.transactionId} for company ${transaction.companyNumber} is not linked to the company number stored in the session ${session.companyNumber}`
                        );
                        return next(new Error("Transaction company number does not match session company number"));
                    }
                    logger.info(
                        `Transaction ${session.transactionId} for company ${transaction.companyNumber} is linked to the company number stored in the session ${session.companyNumber}`
                    );
                    next();
                })
                .catch(next);
        }
        logger.info(`Transaction ${transactionId} unchanged from transaction in session ${session.transactionId}`);
        return next();
    };
}
