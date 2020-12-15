import { inject } from 'inversify'
import { controller, httpGet, requestParam } from 'inversify-express-utils'
import { RedirectResult } from 'inversify-express-utils/dts/results'

import BaseController from 'app/controllers/base.controller'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { APPLICATION_STATUS_URI, CHANGE_DETAILS_URI } from 'app/paths'
import SessionService from 'app/services/session/session.service'

@controller(APPLICATION_STATUS_URI)
export class ApplicationStatusController extends BaseController {

  public constructor(@inject(SessionService) private session: SessionService) {
    super()
  }

  @httpGet('/:signatoryId/change')
  public async change(@requestParam('signatoryId') signatoryId: string): Promise<RedirectResult> {
    const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

    dissolutionSession.signatoryIdToEdit = signatoryId

    this.session.setDissolutionSession(this.httpContext.request, dissolutionSession)

    return super.redirect(CHANGE_DETAILS_URI)
  }
}
