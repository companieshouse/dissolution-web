import { inject } from 'inversify'
import { controller, httpGet } from 'inversify-express-utils'
import { RedirectResult } from 'inversify-express-utils/dts/results'

import BaseController from 'app/controllers/base.controller'
import ViewApplicationStatusMapper from 'app/mappers/view-application-status/viewApplicationStatus.mapper'
import ApplicationStatus from 'app/models/dto/applicationStatus.enum'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import OfficerType from 'app/models/dto/officerType.enum'
import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { ViewApplicationStatus } from 'app/models/view/viewApplicationStatus.model'
import { PAYMENT_REVIEW_URI, WAIT_FOR_OTHERS_TO_SIGN_URI } from 'app/paths'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import SessionService from 'app/services/session/session.service'

interface ViewModel {
  dissolutionSession: DissolutionSession
  officerType: OfficerType
  viewApplicationStatus: ViewApplicationStatus
}

@controller(WAIT_FOR_OTHERS_TO_SIGN_URI)
export class WaitForOthersToSignController extends BaseController {

  public constructor(
    @inject(SessionService) private session: SessionService,
    @inject(DissolutionService) private dissolutionService: DissolutionService,
    @inject(ViewApplicationStatusMapper) private viewApplicationStatusMapper: ViewApplicationStatusMapper
  ) {
    super()
  }

  @httpGet('')
  public async get(): Promise<RedirectResult|string> {
    const token: string = this.session.getAccessToken(this.httpContext.request)
    const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

    const dissolution: Optional<DissolutionGetResponse> = await this.dissolutionService.getDissolution(token, dissolutionSession)

    if (dissolution?.application_status === ApplicationStatus.PENDING_PAYMENT) {
      return this.redirect(PAYMENT_REVIEW_URI)
    }

    return this.renderView(dissolutionSession.officerType!, dissolution!)
  }

  private async renderView(officerType: OfficerType, dissolution: DissolutionGetResponse): Promise<string> {
    const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!
    const viewModel: ViewModel = {
      dissolutionSession,
      officerType,
      viewApplicationStatus: this.viewApplicationStatusMapper.mapToViewModel(dissolutionSession, dissolution, true)
    }

    return super.render('wait-for-others-to-sign', viewModel)
  }
}
