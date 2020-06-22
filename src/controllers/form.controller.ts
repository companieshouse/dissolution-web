import { BAD_REQUEST, OK } from 'http-status-codes'
import { inject } from 'inversify'
import { controller, httpGet, httpPost, requestBody } from 'inversify-express-utils'
import BaseController from './base.controller'

import { FormFormModel } from 'app/models/forms/form.model'
import Optional from 'app/models/optional'
import ValidationErrors from 'app/models/view/validationErrors.model'
import { FORM_PAGE_URI } from 'app/paths'
import formSchema from 'app/schemas/form.schema'
import FormValidator from 'app/utils/formValidator.util'

interface FormViewModel {
  data?: FormFormModel
  errors?: ValidationErrors
}

@controller(FORM_PAGE_URI)
export class FormController extends BaseController {

  public constructor(@inject(FormValidator) private validator: FormValidator) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    return this.renderView()
  }

  @httpPost('')
  public async post(@requestBody() body: FormFormModel): Promise<string | void> {
    const errors: Optional<ValidationErrors> = this.validator.validate(body, formSchema)
    if (errors) {
      return this.renderView(body, errors)
    }

    this.httpContext.response.redirect(FORM_PAGE_URI)
  }

  private async renderView(data?: FormFormModel, errors?: ValidationErrors): Promise<string> {
    const viewModel: FormViewModel = {
      data,
      errors
    }

    return super.render('form', viewModel, errors ? BAD_REQUEST : OK)
  }
}
