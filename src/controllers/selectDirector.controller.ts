import { BAD_REQUEST, OK } from 'http-status-codes'
import { inject } from 'inversify'
import { controller, httpGet, httpPost, requestBody } from 'inversify-express-utils'
import BaseController from './base.controller'

import Optional from 'app/models/optional'
import SelectDirectorFormModel from 'app/models/selectDirector.model'
import ValidationErrors from 'app/models/validationErrors'
import { SELECT_DIRECTOR_URI } from 'app/paths'
import selectDirectorSchema from 'app/schemas/selectDirector.schema'
import FormValidator from 'app/utils/formValidator.util'

interface ViewModel {
  data?: SelectDirectorFormModel
  errors?: ValidationErrors
}

@controller(SELECT_DIRECTOR_URI)
export class SelectDirectorController extends BaseController {

  public constructor(@inject(FormValidator) private validator: FormValidator) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    return this.renderView()
  }

  @httpPost('')
  public async post(@requestBody() body: SelectDirectorFormModel): Promise<string | void> {
    const errors: Optional<ValidationErrors> = this.validator.validate(body, selectDirectorSchema)
    if (errors) {
      return this.renderView(body, errors)
    }

    this.httpContext.response.redirect(this.getRedirectURI(body))
  }

  private async renderView(data?: SelectDirectorFormModel, errors?: ValidationErrors): Promise<string> {
    const viewModel: ViewModel = {
      data,
      errors
    }

    return super.render('select-director', viewModel, errors ? BAD_REQUEST : OK)
  }

  private getRedirectURI(body: SelectDirectorFormModel): string {
    console.log(body)
    return ''
  }
}
