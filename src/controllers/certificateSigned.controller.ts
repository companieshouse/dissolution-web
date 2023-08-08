import { inject } from "inversify";
import { controller, httpGet } from "inversify-express-utils";

import BaseController from "app/controllers/base.controller";
import ViewApplicationStatusMapper from "app/mappers/view-application-status/viewApplicationStatus.mapper";
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse";
import OfficerType from "app/models/dto/officerType.enum";
import Optional from "app/models/optional";
import DissolutionSession from "app/models/session/dissolutionSession.model";
import { ViewApplicationStatus } from "app/models/view/viewApplicationStatus.model";
import { CERTIFICATE_SIGNED_URI } from "app/paths";
import DissolutionService from "app/services/dissolution/dissolution.service";
import SessionService from "app/services/session/session.service";

interface ViewModel {
  officerType: OfficerType
  viewApplicationStatus: ViewApplicationStatus
}

@controller(CERTIFICATE_SIGNED_URI)
export class CertificateSignedController extends BaseController {

    public constructor (
    @inject(SessionService) private session: SessionService,
    @inject(DissolutionService) private dissolutionService: DissolutionService,
    @inject(ViewApplicationStatusMapper) private viewApplicationStatusMapper: ViewApplicationStatusMapper) {
        super();
    }

    @httpGet('')
    public async get (): Promise<string> {
        const token: string = this.session.getAccessToken(this.httpContext.request);
        const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!;
        const dissolution: Optional<DissolutionGetResponse> = await this.dissolutionService.getDissolution(token, session);

        return this.renderView(session.officerType!, dissolution!);
    }

    private async renderView (officerType: OfficerType, dissolution: DissolutionGetResponse): Promise<string> {
        const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!;
        const viewApplicationStatus: ViewApplicationStatus = this.viewApplicationStatusMapper.mapToViewModel(session, dissolution, false);

        const viewModel: ViewModel = {
            officerType,
            viewApplicationStatus
        };

        return super.render("certificate-signed", viewModel);
    }
}
