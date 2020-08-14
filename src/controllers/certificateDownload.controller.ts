import { inject } from 'inversify'
import { controller, httpGet } from 'inversify-express-utils'
import { RedirectResult } from 'inversify-express-utils/dts/results'

import BaseController from 'app/controllers/base.controller'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { CERTIFICATE_DOWNLOAD_URI } from 'app/paths'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import SessionService from 'app/services/session/session.service'
import TYPES from 'app/types'

@controller(CERTIFICATE_DOWNLOAD_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware, TYPES.CompanyAuthMiddleware)
export class CertificateDownloadController extends BaseController {
  public constructor(
    @inject(DissolutionService) private dissolutionService: DissolutionService,
    @inject(SessionService) private session: SessionService) {
    super()
  }

  @httpGet('')
  public async get(): Promise<RedirectResult> {
    console.log(this.httpContext.request)
    const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

    return this.dissolutionService.generateCertificateUrl(session.approval!.certificateBucket, session.approval!.certificateKey)
      .then(certificateUrl => super.redirect(certificateUrl!))
  }
}
