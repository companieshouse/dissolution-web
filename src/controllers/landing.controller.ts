import { controller, httpGet, httpPost } from 'inversify-express-utils'

import BaseController from 'app/controllers/base.controller'
import { FORM_PAGE_URI, ROOT_URI } from 'app/paths'

@controller(ROOT_URI)
export class LandingController extends BaseController {

  @httpGet('')
  public async get(): Promise<string> {
    return super.render('landing')
  }

  @httpPost('')
  public post(): void {
    this.httpContext.response.redirect(FORM_PAGE_URI)
  }
}
