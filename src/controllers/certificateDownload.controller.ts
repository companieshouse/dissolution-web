import { inject } from "inversify";
import { controller, httpGet } from "inversify-express-utils";
import { RedirectResult } from "inversify-express-utils/lib/results";

import BaseController from "app/controllers/base.controller";
import { CERTIFICATE_DOWNLOAD_URI } from "app/paths";
import DissolutionService from "app/services/dissolution/dissolution.service";
import SessionService from "app/services/session/session.service";
import TYPES from "app/types";
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse";
import DissolutionSession from "app/models/session/dissolutionSession.model";
import Optional from "app/models/optional";
import DissolutionSessionMapper from "app/mappers/session/dissolutionSession.mapper";
import ApplicationStatus from "app/models/dto/applicationStatus.enum";
import { NotFoundError } from "app/errors/notFoundError.error";

@controller(CERTIFICATE_DOWNLOAD_URI, TYPES.JourneyIdAuthMiddleware)
export class CertificateDownloadController extends BaseController {
    public constructor(
        @inject(SessionService) private readonly sessionService: SessionService,
        @inject(DissolutionSessionMapper) private readonly mapper: DissolutionSessionMapper,
        @inject(DissolutionService) private readonly dissolutionService: DissolutionService
    ) {
        super();
    }

    @httpGet("")
    public async get(): Promise<RedirectResult> {
        const session: DissolutionSession = this.sessionService.getDissolutionSession(this.httpContext.request)!;
        const userEmail: string = this.sessionService.getUserEmail(this.httpContext.request)!;

        const dissolution: DissolutionGetResponse = (await this.getDissolution(session))!;
        session.confirmation = this.mapper.mapToDissolutionConfirmation(dissolution);
        this.sessionService.setDissolutionSession(this.httpContext.request, session);

        if (this.isAllowed(dissolution, userEmail)) {
            return super.redirect(
                await this.dissolutionService.generateDissolutionCertificateUrl(session.confirmation)
            );
        }
        throw new NotFoundError("Dissolution Certificate not found");
    }

    private async getDissolution(session: DissolutionSession): Promise<Optional<DissolutionGetResponse>> {
        const token: string = this.sessionService.getAccessToken(this.httpContext.request);
        return this.dissolutionService.getDissolution(token, session);
    }

    private isAllowed(dissolution: DissolutionGetResponse, userEmail: string): boolean {
        if (!dissolution) {
            return false; // Dissolution is inactive or doesn't exist
        }

        const isApplicant = dissolution.created_by === userEmail;
        const isPaid = dissolution.application_status === ApplicationStatus.PAID;
        return isApplicant && isPaid;
    }
}
