import { inject } from 'inversify'
import { controller, httpGet, httpPost } from 'inversify-express-utils'
import BaseController from './base.controller'

import DissolutionApprovalModel from 'app/models/form/dissolutionApproval.model'
import { ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI, } from 'app/paths'
import SessionService from 'app/services/session/session.service'
import TYPES from 'app/types'

interface ViewModel {
  approvalModel: DissolutionApprovalModel
}

@controller(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware, TYPES.CompanyAuthMiddleware)
export class EndorseCompanyClosureCertificateController extends BaseController {

  public constructor(@inject(SessionService) private session: SessionService) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    const approvalModel: DissolutionApprovalModel = this.session.getDissolutionSession(this.httpContext.request)!.approval!

    const viewModel: ViewModel = {
      approvalModel
    }
    return super.render('endorse-company-closure-certificate', viewModel)
  }

  @httpPost('')
  public post(): void {
    this.httpContext.response.redirect(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI) // TODO redirect to correct url
  }
}
