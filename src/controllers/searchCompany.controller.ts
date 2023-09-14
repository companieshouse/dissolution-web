import { StatusCodes } from "http-status-codes"
import { inject } from "inversify"
import { controller, httpGet, httpPost, requestBody } from "inversify-express-utils"
import { RedirectResult } from "inversify-express-utils/dts/results"

import BaseController from "app/controllers/base.controller"
import SearchCompanyFormModel from "app/models/form/searchCompany.model"
import Optional from "app/models/optional"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import ValidationErrors from "app/models/view/validationErrors.model"
import { SEARCH_COMPANY_URI, VIEW_COMPANY_INFORMATION_URI, WHO_TO_TELL_URI } from "app/paths"
import formSchema from "app/schemas/searchCompany.schema"
import CompanyService from "app/services/company/company.service"
import SessionService from "app/services/session/session.service"
import CompanyNumberSanitizer from "app/utils/companyNumberSanitizer"
import FormValidator from "app/utils/formValidator.util"

interface ViewModel {
  backUri?: string
  data?: SearchCompanyFormModel
  errors?: ValidationErrors
}

@controller(SEARCH_COMPANY_URI)
export class SearchCompanyController extends BaseController {

    public constructor (
    @inject(FormValidator) private validator: FormValidator,
    @inject(CompanyService) private companyService: CompanyService,
    @inject(SessionService) private sessionService: SessionService,
    @inject(CompanyNumberSanitizer) private companyNumberSanitizer: CompanyNumberSanitizer
    ) {
        super()
    }

    @httpGet('')
    public async get (): Promise<string> {
        return this.renderView()
    }

    @httpPost('')
    public async post (@requestBody() body: SearchCompanyFormModel): Promise<string | RedirectResult> {
        const lang = this.httpContext.request.body.lang
        body.companyNumber = this.companyNumberSanitizer.sanitizeCompany(body.companyNumber!)
        const errors: Optional<ValidationErrors> = this.validator.validate(body, formSchema(lang))
        if (errors) {
            return this.renderView(body, errors)
        }

        if (!await this.doesCompanyExist(body.companyNumber)) {
            return this.renderView(body, { companyNumber: "Company number does not exist or is incorrect" })
        }

        this.updateSession(body)

        return this.redirect(VIEW_COMPANY_INFORMATION_URI)
    }

    private async renderView (data?: SearchCompanyFormModel, errors?: ValidationErrors): Promise<string> {
        const viewModel: ViewModel = {
            backUri: WHO_TO_TELL_URI,
            data,
            errors
        }

        return super.render("search-company", viewModel, errors ? StatusCodes.BAD_REQUEST : StatusCodes.OK)
    }

    private async doesCompanyExist (companyNumber: string): Promise<boolean> {
        const token: string = this.sessionService.getAccessToken(this.httpContext.request)
        return this.companyService.doesCompanyExist(token, companyNumber)
    }

    private updateSession (body: SearchCompanyFormModel): void {
        const updatedSession: DissolutionSession = {
            ...this.sessionService.getDissolutionSession(this.httpContext.request),
            companyNumber: body.companyNumber,
            remindDirectorList: []
        }
        this.sessionService.setDissolutionSession(this.httpContext.request, updatedSession)
    }
}
