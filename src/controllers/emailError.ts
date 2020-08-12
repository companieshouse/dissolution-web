import { controller, httpGet } from 'inversify-express-utils'

import BaseController from 'app/controllers/base.controller'
import { EMAIL_ERROR_URI } from 'app/paths'
import TYPES from 'app/types'

@controller(EMAIL_ERROR_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware, TYPES.CompanyAuthMiddleware)
export class CertificateSignedController extends BaseController {

  @httpGet('')
  public async get(): Promise<string> {
    return super.render('email-error')
  }
}
