import { controller, httpGet } from 'inversify-express-utils'

import BaseController from 'app/controllers/base.controller'
import { VIEW_FINAL_CONFIRMATION } from 'app/paths'
import TYPES from 'app/types'

@controller(VIEW_FINAL_CONFIRMATION, TYPES.SessionMiddleware, TYPES.AuthMiddleware, TYPES.CompanyAuthMiddleware)
export class WaitForOthersToSignController extends BaseController {

  @httpGet('')
  public async get(): Promise<string> {

    return super.render('view-final-confirmation')
  }
}