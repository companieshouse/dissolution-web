import { controller, httpGet, httpPost } from 'inversify-express-utils'

import BaseController from 'app/controllers/base.controller'
import { CHECK_YOUR_ANSWERS_URI, WHO_TO_TELL_URI } from 'app/paths'
import TYPES from 'app/types'

@controller(CHECK_YOUR_ANSWERS_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware)
export class CheckYourAnswersController extends BaseController {

  @httpGet('')
  public async get(): Promise<string> {
    return super.render('check-your-answers')
  }

  @httpPost('')
  public post(): void {
    this.httpContext.response.redirect(WHO_TO_TELL_URI)
  }
}