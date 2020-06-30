import { inject } from 'inversify'
import { controller, httpGet, httpPost } from 'inversify-express-utils'
import BaseController from './base.controller'

import { DissolutionGetResponse } from 'app/models/dto/dissolutionGetResponse'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI, } from 'app/paths'
import { DissolutionService } from 'app/services/dissolution/dissolution.service'
import SessionService from 'app/services/session/session.service'
import TYPES from 'app/types'

interface ViewModel {
  dissolutionInfo: DissolutionGetResponse
}

@controller(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware)
export class EndorseCompanyClosureCertificateController extends BaseController {

  public constructor(
    @inject(SessionService) private session: SessionService,
    @inject(DissolutionService) private service: DissolutionService
  ) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    const dissolutionInfo: DissolutionGetResponse = await this.getDissolutionInfo()

    const viewModel: ViewModel = {
      dissolutionInfo
    }
    return super.render('endorse-company-closure-certificate', viewModel)
  }

  @httpPost('')
  public post(): void {
    this.httpContext.response.redirect(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI) // TODO redirect to correct url
  }

  private async getDissolutionInfo(): Promise<DissolutionGetResponse> {
    const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!
    const token: string = this.session.getAccessToken(this.httpContext.request)
    return this.service.getDissolution(token, dissolutionSession)
  }
}
