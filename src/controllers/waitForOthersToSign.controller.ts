import {inject} from "inversify"
import {controller, httpGet} from "inversify-express-utils"
import {RedirectResult} from "inversify-express-utils/lib/results"
import ViewApplicationStatusMapper from "app/mappers/view-application-status/viewApplicationStatus.mapper"
import ApplicationStatus from "app/models/dto/applicationStatus.enum"
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse"
import OfficerType from "app/models/dto/officerType.enum"
import Optional from "app/models/optional"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import {ViewApplicationStatus} from "app/models/view/viewApplicationStatus.model"
import {PAYMENT_REVIEW_URI, WAIT_FOR_OTHERS_TO_SIGN_URI} from "app/paths"
import DissolutionService from "app/services/dissolution/dissolution.service"
import SessionService from "app/services/session/session.service"
import TYPES from "app/types";
import JourneyPathService from "app/services/session/journeyPath.service";
import JourneyBaseController from "app/controllers/JourneyBase.controller";

interface ViewModel {
  dissolutionSession: DissolutionSession
  officerType: OfficerType
  viewApplicationStatus: ViewApplicationStatus
}

@controller(WAIT_FOR_OTHERS_TO_SIGN_URI, TYPES.JourneyIdAuthMiddleware)
export class WaitForOthersToSignController extends JourneyBaseController {

    public constructor (
    @inject(SessionService) private readonly session: SessionService,
    @inject(DissolutionService) private readonly dissolutionService: DissolutionService,
    @inject(ViewApplicationStatusMapper) private readonly viewApplicationStatusMapper: ViewApplicationStatusMapper,
    @inject(JourneyPathService) readonly journeyPathService: JourneyPathService,
    ) {
        super(journeyPathService)
    }

    @httpGet("")
    public async get (): Promise<RedirectResult|string> {
        const token: string = this.session.getAccessToken(this.httpContext.request)
        const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

        const dissolution: Optional<DissolutionGetResponse> = await this.dissolutionService.getDissolution(token, dissolutionSession)

        if (dissolution?.application_status === ApplicationStatus.PENDING_PAYMENT) {
            return this.redirect(this.journeyPath(PAYMENT_REVIEW_URI))
        }

        return this.renderView(dissolutionSession.officerType!, dissolution!)
    }

    private async renderView (officerType: OfficerType, dissolution: DissolutionGetResponse): Promise<string> {
        const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!
        const viewModel: ViewModel = {
            dissolutionSession,
            officerType,
            viewApplicationStatus: this.viewApplicationStatusMapper.mapToViewModel(dissolutionSession, dissolution, true)
        }

        return super.render("wait-for-others-to-sign", viewModel)
    }
}
