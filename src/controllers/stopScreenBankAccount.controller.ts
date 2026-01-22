import { StatusCodes } from "http-status-codes"
import { inject } from "inversify"
import { controller, httpGet, httpPost, requestBody } from "inversify-express-utils"
import { RedirectResult } from "inversify-express-utils/lib/results"
import BaseController from "app/controllers/base.controller"
import ValidationErrors from "app/models/view/validationErrors.model"
import { SEARCH_COMPANY_URI, WHO_TO_TELL_URI, STOP_SCREEN_BANK_ACCOUNT_URI } from "app/paths"
import FormValidator from "app/utils/formValidator.util"

interface ViewModel {
backUri?: string
}

@controller(STOP_SCREEN_BANK_ACCOUNT_URI)
export class StopScreenBankAccountController extends BaseController {

    public constructor () {
        super()
    }

    @httpGet("")
    public async get (): Promise<string> {
        return this.renderView()
    }

    private async renderView (): Promise<string> {
        const viewModel: ViewModel = {
            backUri: WHO_TO_TELL_URI
        }

        return super.render("stop-screen-bank-account", viewModel, StatusCodes.OK)
    }

    @httpPost("")
    public async post (): Promise<string | RedirectResult> {
        return this.redirect(SEARCH_COMPANY_URI)
    }
}
