import { buildPath } from "app/utils/buildPath";
import { Request } from "express";
import { provide } from "inversify-binding-decorators";

@provide(JourneyPathService)
export default class JourneyPathService {
    public journeyPath(
        req: Request,
        pathTemplate: string,
        options?: {
            journeyId?: string;
            companyNumber?: string;
            params?: Record<string, string | number>;
        }
    ): string {
        const resolveJourneyId = options?.journeyId ?? req.params.journeyId;
        const resolveCompanyNumber = options?.companyNumber ?? req.params.companyNumber;

        if (!resolveJourneyId) {
            throw new Error("No journeyId");
        }

        if (!resolveCompanyNumber) {
            throw new Error("No companyNumber");
        }

        return buildPath(pathTemplate, {
            journeyId: resolveJourneyId,
            companyNumber: resolveCompanyNumber,
            ...options?.params,
        });
    }
}
