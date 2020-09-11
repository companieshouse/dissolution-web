import { inject } from 'inversify'
import { controller, httpGet } from 'inversify-express-utils'

import BaseController from 'app/controllers/base.controller'
import OfficerType from 'app/models/dto/officerType.enum'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { VIEW_FINAL_CONFIRMATION_URI } from 'app/paths'
import SessionService from 'app/services/session/session.service'
import TYPES from 'app/types'

interface ViewModel {
  applicationReferenceNumber: string,
  officerType: OfficerType
}

@controller(VIEW_FINAL_CONFIRMATION_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware, TYPES.CompanyAuthMiddleware)
export class ViewFinalConfirmationController extends BaseController {

  public constructor(
    @inject(SessionService) private sessionService: SessionService) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    const session: DissolutionSession = this.sessionService.getDissolutionSession(this.httpContext.request)!

    const viewModel: ViewModel = {
      applicationReferenceNumber: this.getApplicationReferenceNumber(),
      officerType: session.officerType!
    }

    return super.render('view-final-confirmation', viewModel)
  }

  private getApplicationReferenceNumber(): string {
    return this.sessionService
      .getDissolutionSession(this.httpContext.request)!.applicationReferenceNumber!
  }
}
