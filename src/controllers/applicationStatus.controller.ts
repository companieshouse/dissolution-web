import {inject} from "inversify"
import {controller, httpGet, httpPost, queryParam, requestBody, requestParam} from "inversify-express-utils"
import {RedirectResult} from "inversify-express-utils/lib/results"
import {StatusCodes} from "http-status-codes"
import {FrontendError} from "app/errors/frontendError.error"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import {APPLICATION_STATUS_URI, CHANGE_DETAILS_URI, WAIT_FOR_OTHERS_TO_SIGN_URI} from "app/paths"
import DissolutionService from "app/services/dissolution/dissolution.service"
import FormValidator from "app/utils/formValidator.util"
import RichFormValidator from "app/utils/richFormValidator.util"
import SessionService from "app/services/session/session.service"
import ResendEmailFormModel from "app/models/form/resendEmail.model"
import TYPES from "app/types"
import JourneyPathService from "app/services/session/journeyPath.service"
import JourneyBaseController from "app/controllers/JourneyBase.controller"
import resendEmailSchema from "app/schemas/resendEmail.schema"

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
            throw new FrontendError("Invalid signatory id", StatusCodes.BAD_REQUEST)
        }

        const companyNumber = this.sessionService.requireDissolutionCompanyNumber(this.httpContext.request)
        const signatoryId = body.signatoryId!

        const signatoryEmail = await this.dissolutionService.getDissolutionSignatoryEmail(
            this.sessionService.getAccessToken(this.httpContext.request),
            companyNumber,
            signatoryId
        )

        if (!signatoryEmail) {
            throw new FrontendError("Signatory email not found", StatusCodes.NOT_FOUND)
        }

        const reminderSent: boolean = await this.dissolutionService.sendEmailNotification(companyNumber, signatoryEmail)

        this.sessionService.updateRemindDirectorList(this.httpContext.request, signatoryId, reminderSent)

        return super.redirect(this.journeyPath(WAIT_FOR_OTHERS_TO_SIGN_URI))
    }
}
