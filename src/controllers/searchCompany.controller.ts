import { controller, httpGet } from 'inversify-express-utils'

import BaseController from 'app/controllers/base.controller'
import { SEARCH_COMPANY_URI } from 'app/paths'
import TYPES from 'app/types'

@controller(SEARCH_COMPANY_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware, TYPES.CompanyAuthMiddleware)
export class SearchCompanyController extends BaseController {

  @httpGet('')
  public async get(): Promise<string> {
    return super.render('search-company')
  }
}