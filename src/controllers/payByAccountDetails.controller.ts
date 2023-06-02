import { StatusCodes } from 'http-status-codes'
import { inject } from 'inversify'
import { controller, httpGet, httpPost, requestBody } from 'inversify-express-utils'
// @ts-ignore
import { RedirectResult } from 'inversify-express-utils/dts/results'

import BaseController from 'app/controllers/base.controller'
import { NotFoundError } from 'app/errors/notFoundError.error'
import ApplicationStatus from 'app/models/dto/applicationStatus.enum'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import PayByAccountDetailsFormModel from 'app/models/form/payByAccountDetails.model'
import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import ValidationErrors from 'app/models/view/validationErrors.model'
import { PAY_BY_ACCOUNT_DETAILS_URI, SEARCH_COMPANY_URI, VIEW_FINAL_CONFIRMATION_URI } from 'app/paths'
import payByAccountDetailsSchema from 'app/schemas/payByAccountDetails.schema'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import PayByAccountService from 'app/services/payment/payByAccount.service'
import SessionService from 'app/services/session/session.service'
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
    @inject(SessionService) private sessionService: SessionService,
    @inject(DissolutionService) private dissolutionService: DissolutionService,
    @inject(FormValidator) private validator: FormValidator,
    @inject(PayByAccountService) private payByAccountService: PayByAccountService,
    @inject(TYPES.PAY_BY_ACCOUNT_FEATURE_ENABLED) private PAY_BY_ACCOUNT_FEATURE_ENABLED: number
  ) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string | RedirectResult> {
    if (!this.PAY_BY_ACCOUNT_FEATURE_ENABLED) {
      return Promise.reject(new NotFoundError('Feature toggle not enabled'))
    }

    if (await this.isAlreadyPaid()) {
      return this.redirect(SEARCH_COMPANY_URI)
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

    const dissolutionSession: DissolutionSession = this.sessionService.getDissolutionSession(this.httpContext.request)!

    await this.dissolutionService.addPayByAccountPaymentData(dissolutionSession, accountNumber)

    return this.redirect(VIEW_FINAL_CONFIRMATION_URI)
  }

  private async renderView(data?: PayByAccountDetailsFormModel, errors?: ValidationErrors): Promise<string> {
    const viewModel: ViewModel = {
      data,
      errors
    }

    return super.render('pay-by-account-details', viewModel, errors ? StatusCodes.BAD_REQUEST : StatusCodes.OK)
  }

  private async isAlreadyPaid(): Promise<boolean> {
    const token: string = this.sessionService.getAccessToken(this.httpContext.request)
    const dissolutionSession: DissolutionSession = this.sessionService.getDissolutionSession(this.httpContext.request)!

    const dissolution: Optional<DissolutionGetResponse> = await this.dissolutionService.getDissolution(token, dissolutionSession)

    return dissolution!.application_status === ApplicationStatus.PAID
  }
}
