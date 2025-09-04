import { controller, httpGet } from "inversify-express-utils"

import BaseController from "app/controllers/base.controller"
import { ROOT_URI, WHO_TO_TELL_URI } from "app/paths"

@controller(ROOT_URI)
export class LandingController extends BaseController {

    @httpGet("")
    public async get (): Promise<string> {
        return super.render("landing", {
            redirectUrl: `${WHO_TO_TELL_URI}`
        })
    }
}
