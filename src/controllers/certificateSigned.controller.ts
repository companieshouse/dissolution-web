import { inject } from 'inversify'
import { controller, httpGet } from 'inversify-express-utils'

import BaseController from 'app/controllers/base.controller'
import OfficerType from 'app/models/dto/officerType.enum'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { CERTIFICATE_SIGNED_URI } from 'app/paths'
import SessionService from 'app/services/session/session.service'

interface ViewModel {
  officerType: OfficerType
}

@controller(CERTIFICATE_SIGNED_URI)
export class CertificateSignedController extends BaseController {

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

    return super.render('certificate-signed', viewModel)
  }
}
