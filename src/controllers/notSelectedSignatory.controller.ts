import { controller, httpGet } from 'inversify-express-utils'

import BaseController from 'app/controllers/base.controller'
import { NOT_SELECTED_SIGNATORY } from 'app/paths'

@controller(NOT_SELECTED_SIGNATORY)
export class NotSelectedSignatoryController extends BaseController {

  @httpGet('')
  public async get(): Promise<string> {
    return super.render('not-selected-signatory')
  }
}
