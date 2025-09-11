import { inject } from "inversify"
import { controller, httpGet } from "inversify-express-utils"

import BaseController from "app/controllers/base.controller"
import ApplicationType from "app/models/dto/applicationType.enum"
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse"
import OfficerType from "app/models/dto/officerType.enum"
import PaymentType from "app/models/dto/paymentType.enum"
import Optional from "app/models/optional"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import { VIEW_FINAL_CONFIRMATION_URI } from "app/paths"
import DissolutionService from "app/services/dissolution/dissolution.service"
import SessionService from "app/services/session/session.service"

interface ViewModel {
  applicationReferenceNumber: string,
  officerType: OfficerType,
  paymentType: PaymentType,
  isMultiDirector: boolean,
  applicationType: ApplicationType
}

@controller(VIEW_FINAL_CONFIRMATION_URI)
export class ViewFinalConfirmationController extends BaseController {

    public constructor (
    @inject(SessionService) private sessionService: SessionService,
    @inject(DissolutionService) private dissolutionService: DissolutionService
    ) {
        super()
    }

    @httpGet("")
    public async get (): Promise<string> {
        const token: string = this.sessionService.getAccessToken(this.httpContext.request)
        const dissolutionSession: DissolutionSession = this.sessionService.getDissolutionSession(this.httpContext.request)!

        const dissolution: Optional<DissolutionGetResponse> = await this.dissolutionService.getDissolution(token, dissolutionSession)

        const viewModel: ViewModel = {
            applicationReferenceNumber: this.getApplicationReferenceNumber(),
            officerType: dissolutionSession.officerType!,
            paymentType: dissolutionSession.paymentType!,
            isMultiDirector: dissolution!.directors.length > 1,
            applicationType: dissolution!.application_type
        }

        return super.render("view-final-confirmation", viewModel)
    }

    private getApplicationReferenceNumber (): string {
        return this.sessionService
            .getDissolutionSession(this.httpContext.request)!.applicationReferenceNumber!
    }
}
