import { controller, httpGet } from 'inversify-express-utils'

import BaseController from 'app/controllers/base.controller'
import { VIEW_COMPANY_INFORMATION_URI } from 'app/paths'
import TYPES from 'app/types'

@controller(VIEW_COMPANY_INFORMATION_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware)
export class ViewCompanyInformationController extends BaseController {

  @httpGet('')
  public async get(): Promise<string> {
    return super.render('view-company-information')
  }
}