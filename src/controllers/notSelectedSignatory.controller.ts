import { controller, httpGet } from 'inversify-express-utils'

import BaseController from 'app/controllers/base.controller'
import { NOT_SELECTED_SIGNATORY } from 'app/paths'
import TYPES from 'app/types'

@controller(NOT_SELECTED_SIGNATORY, TYPES.AuthMiddleware, TYPES.CompanyAuthMiddleware)
export class NotSelectedSignatoryController extends BaseController {

  @httpGet('')
  public async get(): Promise<string> {
    return super.render('not-selected-signatory')
  }
}
