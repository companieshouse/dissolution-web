import { inject } from 'inversify'
import { controller, httpGet } from 'inversify-express-utils'

import BaseController from 'app/controllers/base.controller'
import DissolutionGetDirector from 'app/models/dto/dissolutionGetDirector'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import OfficerType from 'app/models/dto/officerType.enum'
import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { WAIT_FOR_OTHERS_TO_SIGN_URI } from 'app/paths'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import SessionService from 'app/services/session/session.service'

interface ViewModel {
  officerType: OfficerType
  signatories: DissolutionGetDirector[]
}

@controller(WAIT_FOR_OTHERS_TO_SIGN_URI)
export class WaitForOthersToSignController extends BaseController {

  public constructor(
    @inject(SessionService) private session: SessionService,
    @inject(DissolutionService) private dissolutionService: DissolutionService
  ) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    const token: string = this.session.getAccessToken(this.httpContext.request)
    const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

    const dissolution: Optional<DissolutionGetResponse> = await this.dissolutionService.getDissolution(token, session)

    return this.renderView(session.officerType!, dissolution!)
  }

  private async renderView(officerType: OfficerType, dissolution: DissolutionGetResponse): Promise<string> {
    const viewModel: ViewModel = {
      officerType,
      signatories: dissolution!.directors
    }

    return super.render('wait-for-others-to-sign', viewModel)
  }
}
