import { inject } from 'inversify'
import { controller, httpGet, httpPost } from 'inversify-express-utils'
import { RedirectResult } from 'inversify-express-utils/dts/results'

import BaseController from 'app/controllers/base.controller'
import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { CHECK_YOUR_ANSWERS_URI, ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI } from 'app/paths'
import { DissolutionService } from 'app/services/dissolution/dissolution.service'
import SessionService from 'app/services/session/session.service'
import TYPES from 'app/types'

@controller(CHECK_YOUR_ANSWERS_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware)
export class CheckYourAnswersController extends BaseController {
  public constructor(
    @inject(DissolutionService) private dissolutionService: DissolutionService,
    @inject(SessionService) private session: SessionService) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    return super.render('check-your-answers')
  }

  @httpPost('')
  public async post(): Promise<RedirectResult> {
    const token: string = this.session.getAccessToken(this.httpContext.request)
    const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

    const applicationReferenceNumber: Optional<string> = await this.dissolutionService.createDissolution(token, dissolutionSession)

    this.updateSession(applicationReferenceNumber!)

    return this.redirect(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
  }

  private updateSession(companyReferenceNumber: string): void {
    const updatedSession: DissolutionSession = {
      ...this.session.getDissolutionSession(this.httpContext.request),
      companyReferenceNumber
    }

    this.session.setDissolutionSession(this.httpContext.request, updatedSession)
  }
}