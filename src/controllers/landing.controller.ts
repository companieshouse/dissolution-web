import { controller, httpGet } from "inversify-express-utils"

import BaseController from "app/controllers/base.controller"
import { ROOT_URI, WHO_TO_TELL_URI } from "app/paths"
import TYPES from "app/types"
import { inject } from "inversify"

@controller(ROOT_URI)
export class LandingController extends BaseController {

    public constructor (
    @inject(TYPES.LLDS01_AND_DS01_FEE) private readonly fee: string
    ) {
        super()
    }

    @httpGet("")
    public async get (): Promise<string> {
        return super.render("landing", {
            redirectUrl: `${WHO_TO_TELL_URI}`,
            LLDS01_AND_DS01_FEE: this.fee
        })
    }
}
