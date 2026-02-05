import { controller, httpGet } from "inversify-express-utils"
import { RedirectResult } from "inversify-express-utils/lib/results"
import BaseController from "app/controllers/base.controller"
import { SEARCH_COMPANY_URI, COMPANY_LOOKUP } from "app/paths"

@controller(SEARCH_COMPANY_URI)
export class SearchCompanyController extends BaseController {
    @httpGet("")
    public async get (): Promise<string | RedirectResult> {
        return this.redirect(encodeURI(COMPANY_LOOKUP))
    }
}
