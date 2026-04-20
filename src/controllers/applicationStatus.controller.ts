import {inject} from "inversify"
import {controller, httpGet, queryParam, requestParam} from "inversify-express-utils"
import {RedirectResult} from "inversify-express-utils/lib/results"
import ViewApplicationStatusMapper from "app/mappers/view-application-status/viewApplicationStatus.mapper"
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse"
import Optional from "app/models/optional"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import {APPLICATION_STATUS_URI, CHANGE_DETAILS_URI, WAIT_FOR_OTHERS_TO_SIGN_URI} from "app/paths"
import DissolutionService from "app/services/dissolution/dissolution.service"
import SessionService from "app/services/session/session.service"
import TYPES from "app/types";
import JourneyPathService from "app/services/session/journeyPath.service";
import JourneyBaseController from "app/controllers/JourneyBase.controller";

@controller(APPLICATION_STATUS_URI, TYPES.JourneyIdAuthMiddleware)
export class ApplicationStatusController extends JourneyBaseController {

    public constructor (
    @inject(SessionService) private readonly session: SessionService,
    @inject(DissolutionService) private readonly dissolutionService: DissolutionService,
    @inject(ViewApplicationStatusMapper) private readonly viewApplicationStatusMapper: ViewApplicationStatusMapper,
    @inject(JourneyPathService) readonly journeyPathService: JourneyPathService
    ) {
        super(journeyPathService)
    }

    @httpGet("/:signatoryId/change")
    public async change (@requestParam("signatoryId") signatoryId: string, @queryParam("check_answers") isFromCheckAnswers: string): Promise<RedirectResult> {
        const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!
        dissolutionSession.signatoryIdToEdit = signatoryId
        dissolutionSession.isFromCheckAnswers = isFromCheckAnswers === "true"

        this.session.setDissolutionSession(this.httpContext.request, dissolutionSession)

        return super.redirect(this.journeyPath(CHANGE_DETAILS_URI))
    }

    @httpGet("/:signatoryEmail/send-email")
    public async resend (@requestParam("signatoryEmail") signatoryEmail: string): Promise<RedirectResult> {

        const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

        const dissolution: Optional<DissolutionGetResponse> = await this.dissolutionService.getDissolution(
            this.session.getAccessToken(this.httpContext.request),
            dissolutionSession
        )

        const reminderSent: boolean = await this.dissolutionService.sendEmailNotification(dissolutionSession.companyNumber!, signatoryEmail)

        this.viewApplicationStatusMapper.mapToViewModel(dissolutionSession, dissolution!, true).signatories.forEach(signatory => {
            if (signatory.email === signatoryEmail) {
                const id: string = signatory.id
                dissolutionSession.remindDirectorList.push({ id, reminderSent })
            }
        })

        this.session.setDissolutionSession(this.httpContext.request, dissolutionSession)

        return super.redirect(this.journeyPath(WAIT_FOR_OTHERS_TO_SIGN_URI))
    }

}
