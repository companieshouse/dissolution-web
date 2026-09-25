import { buildPath } from "app/utils/buildPath";
import { Request } from "express";
import { provide } from "inversify-binding-decorators";

export type JourneyPathOptions = {
    journeyId?: string;
    companyNumber?: string;
    transactionId?: string;
    params?: Record<string, string | number>;
};

@provide(JourneyPathService)
export default class JourneyPathService {
    public journeyPath(req: Request, pathTemplate: string, options?: JourneyPathOptions): string {
        const resolveJourneyId = options?.journeyId ?? req.params.journeyId;
        const resolveCompanyNumber = options?.companyNumber ?? req.params.companyNumber;
        const resolveTransactionId = options?.transactionId ?? req.params.transactionId;

        if (!resolveJourneyId) {
            throw new Error("No journeyId");
        }

        if (!resolveCompanyNumber) {
            throw new Error("No companyNumber");
        }

        const params: Record<string, string | number> = {
            journeyId: resolveJourneyId,
            companyNumber: resolveCompanyNumber,
            ...options?.params,
        };

        if (resolveTransactionId) {
            params.transactionId = resolveTransactionId;
        } else {
            console.log(">>> No transactionId");
        }

        return buildPath(pathTemplate, params);
    }
}
