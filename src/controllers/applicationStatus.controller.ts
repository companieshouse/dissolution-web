import {inject} from "inversify"
import {controller, httpGet, httpPost, queryParam, requestParam, requestBody} from "inversify-express-utils"
import {RedirectResult} from "inversify-express-utils/lib/results"
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse"
import Optional from "app/models/optional"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import {APPLICATION_STATUS_URI, CHANGE_DETAILS_URI, WAIT_FOR_OTHERS_TO_SIGN_URI} from "app/paths"
import DissolutionService from "app/services/dissolution/dissolution.service"
import FormValidator from "app/utils/formValidator.util"
import RichFormValidator from "app/utils/richFormValidator.util"
import SessionService from "app/services/session/session.service"
import ResendEmailFormModel from "app/models/form/resendEmail.model"
import TYPES from "app/types";
import JourneyPathService from "app/services/session/journeyPath.service";
import JourneyBaseController from "app/controllers/JourneyBase.controller";
import resendEmailSchema from "app/schemas/resendEmail.schema";

@controller(APPLICATION_STATUS_URI, TYPES.JourneyIdAuthMiddleware)
export class ApplicationStatusController extends JourneyBaseController {

    public constructor (
    @inject(SessionService) private readonly sessionService: SessionService,
    @inject(DissolutionService) private readonly dissolutionService: DissolutionService,
    @inject(RichFormValidator) private readonly validator: FormValidator,
    @inject(JourneyPathService) readonly journeyPathService: JourneyPathService
    ) {
        super(journeyPathService)
    }

    @httpGet("/:signatoryId/change")
    public async change (@requestParam("signatoryId") signatoryId: string, @queryParam("check_answers") isFromCheckAnswers: string): Promise<RedirectResult> {
        const dissolutionSession: DissolutionSession = this.sessionService.getDissolutionSession(this.httpContext.request)!
        dissolutionSession.signatoryIdToEdit = signatoryId
        dissolutionSession.isFromCheckAnswers = isFromCheckAnswers === "true"

        this.sessionService.setDissolutionSession(this.httpContext.request, dissolutionSession)

        return super.redirect(this.journeyPath(CHANGE_DETAILS_URI))
    }

    @httpPost("/send-email")
    public async resend (@requestBody() body: ResendEmailFormModel): Promise<RedirectResult> {

        const errors = this.validator.validate(body, resendEmailSchema())

        if (errors) {
            throw new Error("Invalid signatory id")
        }

        const dissolutionSession = this.sessionService.requireDissolutionSession(this.httpContext.request)

        const signatoryId = body.signatoryId!

        const signatoryEmail = await this.getSignatoryEmail(dissolutionSession, signatoryId)

        if (!signatoryEmail) {
            throw new Error("Signatory email not found")
        }

        const reminderSent: boolean = await this.dissolutionService.sendEmailNotification(dissolutionSession.companyNumber!, signatoryEmail)

        this.updateRemindDirectorListInSession(dissolutionSession, signatoryId, reminderSent)

        return super.redirect(this.journeyPath(WAIT_FOR_OTHERS_TO_SIGN_URI))
    }

    private async getSignatoryEmail(dissolutionSession: DissolutionSession, signatoryId: string): Promise<string | undefined> {
        const dissolution: Optional<DissolutionGetResponse> = await this.dissolutionService.getDissolution(
            this.sessionService.getAccessToken(this.httpContext.request),
            dissolutionSession
        )

        const signatory = dissolution?.directors.find(d => (d as any).officer_id === signatoryId)

        return signatory?.email
    }

    private updateRemindDirectorListInSession(session: DissolutionSession, signatoryId: string, reminderSent: boolean) {
        const updatedSession: DissolutionSession = {
            ...session,
            remindDirectorList: [
                ...(session.remindDirectorList || []),
                { id: signatoryId, reminderSent }
            ]
        }

        this.sessionService.setDissolutionSession(this.httpContext.request, updatedSession)
    }
}
