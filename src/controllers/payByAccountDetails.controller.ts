import { StatusCodes } from 'http-status-codes'
import { inject } from 'inversify'
import { controller, httpGet, httpPost, requestBody } from 'inversify-express-utils'
import { RedirectResult } from 'inversify-express-utils/dts/results'

import BaseController from 'app/controllers/base.controller'
import PayByAccountDetailsFormModel from 'app/models/form/payByAccountDetails.model'
import Optional from 'app/models/optional'
import ValidationErrors from 'app/models/view/validationErrors.model'
import { PAY_BY_ACCOUNT_DETAILS_URI, VIEW_FINAL_CONFIRMATION_URI } from 'app/paths'
import payByAccountDetailsSchema from 'app/schemas/payByAccountDetails.schema'
import PayByAccountService from 'app/services/payment/payByAccount.service'
import TYPES from 'app/types'
import FormValidator from 'app/utils/formValidator.util'

interface ViewModel {
  data?: PayByAccountDetailsFormModel
  errors?: ValidationErrors
}

@controller(PAY_BY_ACCOUNT_DETAILS_URI)
export class PayByAccountDetailsController extends BaseController {

  private readonly ERROR_INCORRECT_CREDENTIALS: string = 'Your Presenter ID or Presenter authentication code is incorrect'

  public constructor(
    @inject(TYPES.PAY_BY_ACCOUNT_FEATURE_ENABLED) private PAY_BY_ACCOUNT_FEATURE_ENABLED: number,
    @inject(FormValidator) private validator: FormValidator,
    @inject(PayByAccountService) private payByAccountService: PayByAccountService) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    if (!this.PAY_BY_ACCOUNT_FEATURE_ENABLED) {
      return Promise.reject('Feature not enabled')
    }

    return this.renderView()
  }

  @httpPost('')
  public async post(@requestBody() form: PayByAccountDetailsFormModel): Promise<string | RedirectResult> {
    const errors: Optional<ValidationErrors> = this.validator.validate(form, payByAccountDetailsSchema)
    if (errors) {
      return this.renderView(form, errors)
    }

    const accountNumber: Optional<string> = await this.payByAccountService.getAccountNumber(form)
    if (!accountNumber) {
      return this.renderView(form, { presenterAuthCode: this.ERROR_INCORRECT_CREDENTIALS })
    }

    // TODO in BI-5811 - send account number to Dissolution API

    return this.redirect(VIEW_FINAL_CONFIRMATION_URI)
  }

  private async renderView(data?: PayByAccountDetailsFormModel, errors?: ValidationErrors): Promise<string> {
    const viewModel: ViewModel = {
      data,
      errors
    }

    return super.render('pay-by-account-details', viewModel, errors ? StatusCodes.BAD_REQUEST : StatusCodes.OK)
  }
}
