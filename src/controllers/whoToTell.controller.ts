import { StatusCodes } from 'http-status-codes'
import { inject } from 'inversify'
import { controller, httpGet, httpPost, requestBody } from 'inversify-express-utils'
// @ts-ignore
import { RedirectResult } from 'inversify-express-utils/dts/results'
import BaseController from './base.controller'

import WhoToTellFormModel from 'app/models/form/whoToTell.model'
import Optional from 'app/models/optional'
import ValidationErrors from 'app/models/view/validationErrors.model'
import { ROOT_URI, SEARCH_COMPANY_URI, WHO_TO_TELL_URI } from 'app/paths'
import formSchema from 'app/schemas/whoToTell.schema'
import FormValidator from 'app/utils/formValidator.util'

interface ViewModel {
  backUri?: string
  data?: WhoToTellFormModel
  errors?: ValidationErrors
}

@controller(WHO_TO_TELL_URI)
export class WhoToTellController extends BaseController {

  public constructor(@inject(FormValidator) private validator: FormValidator) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    return this.renderView()
  }

  @httpPost('')
  public async post(@requestBody() body: WhoToTellFormModel): Promise<string | RedirectResult> {
    const errors: Optional<ValidationErrors> = this.validator.validate(body, formSchema)
    if (errors) {
      return this.renderView(body, errors)
    }

    return this.redirect(SEARCH_COMPANY_URI)
  }

  private async renderView(data?: WhoToTellFormModel, errors?: ValidationErrors): Promise<string> {
    const viewModel: ViewModel = {
      backUri: ROOT_URI,
      data,
      errors
    }

    return super.render('who-to-tell', viewModel, errors ? StatusCodes.BAD_REQUEST : StatusCodes.OK)
  }
}
