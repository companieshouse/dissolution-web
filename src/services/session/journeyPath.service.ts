import { inject } from "inversify";
import SessionService from "app/services/session/session.service";
import { buildPath } from "app/utils/buildPath";
import { Request } from "express";
import { provide } from "inversify-binding-decorators";

@provide(JourneyPathService)
export default class JourneyPathService {
    constructor(@inject(SessionService) private readonly sessionService: SessionService) {}

    public journeyPath(
        req: Request,
        pathTemplate: string,
        options?: {
            journeyId?: string;
            companyNumber?: string;
            params?: Record<string, string | number>;
        }
    ): string {
        const resolveJourneyId = options?.journeyId ?? this.sessionService.requireJourneyId(req);
        const resolveCompanyNumber = options?.companyNumber ?? this.sessionService.requireDissolutionCompanyNumber(req);

        if (!resolveJourneyId) {
            throw new Error("No journeyId");
        }

        if (!resolveCompanyNumber) {
            throw new Error("No companyNumber");
        }

        return buildPath(pathTemplate, {
            journeyId: resolveJourneyId,
            companyNumber: resolveCompanyNumber,
            ...(options?.params ?? {}),
        });
    }
}
