import { inject } from "inversify"
import { controller, httpGet, requestParam, queryParam } from "inversify-express-utils"
import { RedirectResult } from "inversify-express-utils/lib/results"

import BaseController from "app/controllers/base.controller"
import ViewApplicationStatusMapper from "app/mappers/view-application-status/viewApplicationStatus.mapper"
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse"
import Optional from "app/models/optional"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import { APPLICATION_STATUS_URI, CHANGE_DETAILS_URI, WAIT_FOR_OTHERS_TO_SIGN_URI } from "app/paths"
import DissolutionService from "app/services/dissolution/dissolution.service"
import SessionService from "app/services/session/session.service"

@controller(APPLICATION_STATUS_URI)
export class ApplicationStatusController extends BaseController {

    public constructor (
    @inject(SessionService) private readonly sessionService: SessionService,
    @inject(DissolutionService) private readonly dissolutionService: DissolutionService,
    @inject(ViewApplicationStatusMapper) private readonly viewApplicationStatusMapper: ViewApplicationStatusMapper
    ) {
        super()
    }

    @httpGet("/:signatoryId/change")
    public async change (@requestParam("signatoryId") signatoryId: string, @queryParam("check_answers") isFromCheckAnswers: string): Promise<RedirectResult> {
        const dissolutionSession: DissolutionSession = this.sessionService.getDissolutionSession(this.httpContext.request)!
        dissolutionSession.signatoryIdToEdit = signatoryId
        dissolutionSession.isFromCheckAnswers = isFromCheckAnswers === "true"

        this.sessionService.setDissolutionSession(this.httpContext.request, dissolutionSession)

        return super.redirect(CHANGE_DETAILS_URI)
    }

    @httpGet("/:signatoryId/send-email")
    public async resend (@requestParam("signatoryId") signatoryId: string): Promise<RedirectResult> {
        const dissolutionSession: DissolutionSession = this.sessionService.getDissolutionSession(this.httpContext.request)!

        const dissolution: Optional<DissolutionGetResponse> = await this.dissolutionService.getDissolution(
            this.sessionService.getAccessToken(this.httpContext.request),
            dissolutionSession
        )

        const signatory = dissolution!.directors.find(d => d.officer_id === signatoryId)
        if (!signatory) {
            return super.redirect(WAIT_FOR_OTHERS_TO_SIGN_URI)
        }

        const reminderSent: boolean = await this.dissolutionService.sendEmailNotification(dissolutionSession.companyNumber!, signatory.email)

        dissolutionSession.remindDirectorList.push({ id: signatory.officer_id, reminderSent })

        this.sessionService.setDissolutionSession(this.httpContext.request, dissolutionSession)

        return super.redirect(WAIT_FOR_OTHERS_TO_SIGN_URI)
    }
}
