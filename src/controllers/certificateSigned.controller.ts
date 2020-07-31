import { controller, httpGet } from 'inversify-express-utils'

import BaseController from 'app/controllers/base.controller'
import { CERTIFICATE_SIGNED_URI } from 'app/paths'
import TYPES from 'app/types'

@controller(CERTIFICATE_SIGNED_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware, TYPES.CompanyAuthMiddleware)
export class CertificateSignedController extends BaseController {

  @httpGet('')
  public async get(): Promise<string> {
    return super.render('certificate-signed')
  }
}
