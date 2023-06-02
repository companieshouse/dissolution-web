import { inject } from 'inversify'
import { controller, httpGet, httpPost } from 'inversify-express-utils'
// @ts-ignore
import { RedirectResult } from 'inversify-express-utils/dts/results'
import { v4 as uuidv4 } from 'uuid'
import BaseController from './base.controller'

import ApplicationStatus from 'app/models/dto/applicationStatus.enum'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import PaymentSummary from 'app/models/dto/paymentSummary'
import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { HOW_DO_YOU_WANT_TO_PAY_URI, PAYMENT_REVIEW_URI, SEARCH_COMPANY_URI } from 'app/paths'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import PaymentService from 'app/services/payment/payment.service'
import SessionService from 'app/services/session/session.service'
import TYPES from 'app/types'

interface ViewModel {
  paymentSummary: PaymentSummary
}

@controller(PAYMENT_REVIEW_URI)
export class PaymentReviewController extends BaseController {

  public constructor(
    @inject(SessionService) private sessionService: SessionService,
    @inject(DissolutionService) private dissolutionService: DissolutionService,
    @inject(PaymentService) private paymentService: PaymentService,
    @inject(TYPES.PAY_BY_ACCOUNT_FEATURE_ENABLED) private PAY_BY_ACCOUNT_FEATURE_ENABLED: number
  ) {
    super()
  }

  @httpGet('')
  public async get(): Promise<RedirectResult|string> {
    const token: string = this.sessionService.getAccessToken(this.httpContext.request)
    const dissolutionSession: DissolutionSession = this.sessionService.getDissolutionSession(this.httpContext.request)!

    if (await this.isAlreadyPaid(dissolutionSession, token)) {
      return this.redirect(SEARCH_COMPANY_URI)
    }

    const paymentSummary: PaymentSummary = await this.dissolutionService.getDissolutionPaymentSummary(dissolutionSession)

    return this.renderView(paymentSummary)
  }

  @httpPost('')
  public async post(): Promise<RedirectResult> {
    if (this.PAY_BY_ACCOUNT_FEATURE_ENABLED) {
      return this.redirect(HOW_DO_YOU_WANT_TO_PAY_URI)
    }

    const token: string = this.sessionService.getAccessToken(this.httpContext.request)
    const dissolutionSession: DissolutionSession = this.sessionService.getDissolutionSession(this.httpContext.request)!

    const paymentStateUUID: string = uuidv4()

    const paymentURL: string = await this.paymentService.generatePaymentURL(token, dissolutionSession, paymentStateUUID)

    this.updateSession(dissolutionSession, paymentStateUUID)

    return this.redirect(paymentURL)
  }

  private async renderView(paymentSummary: PaymentSummary): Promise<string> {
    const viewModel: ViewModel = {
      paymentSummary
    }

    return super.render('payment-review', viewModel)
  }

  private updateSession(dissolutionSession: DissolutionSession, paymentStateUUID: string): void {
    const updatedSession: DissolutionSession = {
      ...dissolutionSession,
      paymentStateUUID
    }

    this.sessionService.setDissolutionSession(this.httpContext.request, updatedSession)
  }

  private async isAlreadyPaid(dissolutionSession: DissolutionSession, token: string): Promise<boolean> {
    const dissolution: Optional<DissolutionGetResponse> = await this.getDissolution(dissolutionSession, token)

    return dissolution!.application_status === ApplicationStatus.PAID
  }

  private async getDissolution(session: DissolutionSession, token: string): Promise<Optional<DissolutionGetResponse>> {
    return this.dissolutionService.getDissolution(token, session)
  }
}
