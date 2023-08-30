import { controller, httpGet } from "inversify-express-utils"

import BaseController from "app/controllers/base.controller"
import { ACCESSIBILITY_STATEMENT_URI } from "app/paths"

@controller(ACCESSIBILITY_STATEMENT_URI,)
export class AccessibilityStatementController extends BaseController {

    @httpGet('')
    public async get (): Promise<string> {
        return super.render("accessibility-statement")
    }
}
