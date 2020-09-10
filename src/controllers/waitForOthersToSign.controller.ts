import { inject } from 'inversify'
import { controller, httpGet } from 'inversify-express-utils'

import BaseController from 'app/controllers/base.controller'
import OfficerType from 'app/models/dto/officerType.enum'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { WAIT_FOR_OTHERS_TO_SIGN_URI } from 'app/paths'
import SessionService from 'app/services/session/session.service'
import TYPES from 'app/types'

interface ViewModel {
  officerType: OfficerType
}

@controller(
  WAIT_FOR_OTHERS_TO_SIGN_URI,
  TYPES.SessionMiddleware, TYPES.AuthMiddleware, TYPES.CompanyAuthMiddleware, TYPES.SignOutUserBannerMiddleware
)
export class WaitForOthersToSignController extends BaseController {

  public constructor(
    @inject(SessionService) private session: SessionService) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

    return this.renderView(session.officerType!)
  }

  private async renderView(officerType: OfficerType): Promise<string> {
    const viewModel: ViewModel = {
      officerType
    }

    return super.render('wait-for-others-to-sign', viewModel)
  }
}
