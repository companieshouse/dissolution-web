import { BAD_REQUEST, OK } from 'http-status-codes'
import { inject } from 'inversify'
import { controller, httpGet, httpPost, requestBody } from 'inversify-express-utils'
import { RedirectResult } from 'inversify-express-utils/dts/results'
import BaseController from './base.controller'

import DissolutionApprovalModel from 'app/models/form/dissolutionApproval.model'
import generateEndorseCertificateFormModel from 'app/models/form/endorseCertificateFormModel'
import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import ValidationErrors from 'app/models/view/validationErrors.model'
import { ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI, REDIRECT_GATE_URI } from 'app/paths'
import formSchema from 'app/schemas/endorseCertificate.schema'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import SessionService from 'app/services/session/session.service'
import FormValidator from 'app/utils/formValidator.util'

interface ViewModel {
  approvalModel: DissolutionApprovalModel
  errors?: ValidationErrors
}

@controller(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
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
  public async post(@requestBody() body: generateEndorseCertificateFormModel): Promise<string | RedirectResult> {
    const errors: Optional<ValidationErrors> = this.validator.validate(body, formSchema)
    if (errors) {
      return this.renderView(errors)
    }

    await this.approveDissolution()

    return this.redirect(REDIRECT_GATE_URI)
  }

  private async approveDissolution(): Promise<void>  {
    const token: string = this.session.getAccessToken(this.httpContext.request)
    const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

    await this.dissolutionService.approveDissolution(token, dissolutionSession)
  }

  private async renderView(errors?: ValidationErrors): Promise<string> {
    const approvalModel: DissolutionApprovalModel = this.session.getDissolutionSession(this.httpContext.request)!.approval!

    const viewModel: ViewModel = {
      approvalModel,
      errors
    }
    return super.render('endorse-company-closure-certificate', viewModel, errors ? BAD_REQUEST : OK)
  }
}
