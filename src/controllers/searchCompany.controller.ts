import { BAD_REQUEST, OK } from 'http-status-codes'
import { inject } from 'inversify'
import { controller, httpGet, httpPost, requestBody } from 'inversify-express-utils'
import BaseController from 'app/controllers/base.controller'

import Optional from 'app/models/optional'
import ValidationErrors from 'app/models/validationErrors'
import { SEARCH_COMPANY_URI, VIEW_COMPANY_INFORMATION_URI, WHO_TO_TELL_URI } from 'app/paths'
import formSchema from 'app/schemas/searchCompany.schema'
import FormValidator from 'app/utils/formValidator.util'
import TYPES from 'app/types'
import SearchCompanyFormModel from 'app/models/searchCompany.model'

interface ViewModel {
  backUri?: string
  data?: SearchCompanyFormModel
  errors?: ValidationErrors
}

@controller(SEARCH_COMPANY_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware)
export class SearchCompanyController extends BaseController {

  public constructor(@inject(FormValidator) private validator: FormValidator) {
  super()
}

  @httpGet('')
  public async get(): Promise<string> {
    return super.render('search-company')
  }

  @httpPost('')
  public async post(@requestBody() body: SearchCompanyFormModel): Promise<string | void> {
    const errors: Optional<ValidationErrors> = this.validator.validate(body, formSchema)
    if (errors) {
      return this.renderView(body, errors)
    }

    this.httpContext.response.redirect(VIEW_COMPANY_INFORMATION_URI)
  }

  private async renderView(data?: SearchCompanyFormModel, errors?: ValidationErrors): Promise<string> {
    const viewModel: ViewModel = {
      backUri: WHO_TO_TELL_URI,
      data,
      errors
    }

    return super.render('search-company-information', viewModel, errors ? BAD_REQUEST : OK)
  }
}