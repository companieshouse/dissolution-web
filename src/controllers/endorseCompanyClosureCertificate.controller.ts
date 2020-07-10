import { inject } from 'inversify'
import { controller, httpGet, httpPost, requestBody } from 'inversify-express-utils'
import { RedirectResult } from 'inversify-express-utils/dts/results'
import BaseController from './base.controller'

import DissolutionApprovalModel from 'app/models/form/dissolutionApproval.model'
import EndorseCertificateFormModel from 'app/models/form/endorseCertificateFormModel'
import Optional from 'app/models/optional'
import ValidationErrors from 'app/models/view/validationErrors.model'
import { ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI, PAYMENT_URI, } from 'app/paths'
import formSchema from 'app/schemas/endorseCertificate.schema'
import SessionService from 'app/services/session/session.service'
import TYPES from 'app/types'
import FormValidator from 'app/utils/formValidator.util'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import DissolutionSession from 'app/models/session/dissolutionSession.model'

interface ViewModel {
  approvalModel: DissolutionApprovalModel
  errors?: ValidationErrors
}

@controller(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware, TYPES.CompanyAuthMiddleware)
export class EndorseCompanyClosureCertificateController extends BaseController {

  public constructor(@inject(SessionService) private session: SessionService,
                    @inject(FormValidator) private validator: FormValidator,
                    @inject(DissolutionService) private dissolutionService: DissolutionService) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    return this.renderView()
  }

  @httpPost('')
  public async post(@requestBody() body: EndorseCertificateFormModel): Promise<string | RedirectResult> {
    const errors: Optional<ValidationErrors> = this.validator.validate(body, formSchema)
    if (errors) {
      return this.renderView(errors)
    }
    const token: string = this.session.getAccessToken(this.httpContext.request)
    const userEmail: string = this.session.getUserEmail(this.httpContext.request)
    const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

    await this.dissolutionService.approveDissolution(token, dissolutionSession, userEmail)

    return this.redirect(PAYMENT_URI) // TODO - Change to Redirect once logic is there 🐓
  }

  private async renderView(errors?: ValidationErrors): Promise<string> {
    const approvalModel: DissolutionApprovalModel = this.session.getDissolutionSession(this.httpContext.request)!.approval!

    const viewModel: ViewModel = {
      approvalModel,
      errors
    }
    return super.render('endorse-company-closure-certificate', viewModel)
  }
}
