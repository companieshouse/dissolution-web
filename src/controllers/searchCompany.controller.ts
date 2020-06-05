import { controller, httpGet } from 'inversify-express-utils'

import BaseController from 'app/controllers/base.controller'
import { SEARCH_COMPANY_URI } from 'app/paths'

@controller(SEARCH_COMPANY_URI)
export class SearchCompanyController extends BaseController {

  @httpGet('')
  public async get(): Promise<string> {
    return super.render('search-company')
  }
}
