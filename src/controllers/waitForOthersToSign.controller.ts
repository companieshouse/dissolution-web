
import { controller, httpGet } from 'inversify-express-utils'

import BaseController from 'app/controllers/base.controller'
import { WAIT_FOR_OTHERS_TO_SIGN_URI } from 'app/paths'
import TYPES from 'app/types'

@controller(WAIT_FOR_OTHERS_TO_SIGN_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware, TYPES.CompanyAuthMiddleware)
export class WaitForOthersToSignController extends BaseController {

  @httpGet('')
  public async get(): Promise<string> {

    return super.render('wait-for-others-to-sign')
  }
}