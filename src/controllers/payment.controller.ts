import { inject } from 'inversify'
import { controller, httpGet } from 'inversify-express-utils'
import { RedirectResult } from 'inversify-express-utils/dts/results'
import { v4 as uuidv4 } from 'uuid'
import BaseController from './base.controller'

import ApplicationStatus from 'app/models/dto/applicationStatus.enum'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { PAYMENT_URI, SEARCH_COMPANY_URI } from 'app/paths'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import PaymentService from 'app/services/payment/payment.service'
import SessionService from 'app/services/session/session.service'
import TYPES from 'app/types'

@controller(PAYMENT_URI, TYPES.AuthMiddleware, TYPES.CompanyAuthMiddleware)
export class PaymentController extends BaseController {

  public constructor(
    @inject(SessionService) private session: SessionService,
    @inject(DissolutionService) private service: DissolutionService,
    @inject(PaymentService) private paymentService: PaymentService
  ) {
    super()
  }

  @httpGet('')
  public async get(): Promise<RedirectResult> {
    const token: string = this.session.getAccessToken(this.httpContext.request)
    const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

    if (await this.isAlreadyPaid(dissolutionSession, token)) {
      return this.redirect(SEARCH_COMPANY_URI)
    }

    const paymentStateUUID: string = uuidv4()

    const paymentURL: string = await this.paymentService.generatePaymentURL(token, dissolutionSession, paymentStateUUID)

    this.updateSession(dissolutionSession, paymentStateUUID)

    return this.redirect(paymentURL)
  }

  private updateSession(dissolutionSession: DissolutionSession, paymentStateUUID: string): void {
    const updatedSession: DissolutionSession = {
      ...dissolutionSession,
      paymentStateUUID
    }

    this.session.setDissolutionSession(this.httpContext.request, updatedSession)
  }

  private async getDissolution(session: DissolutionSession, token: string): Promise<Optional<DissolutionGetResponse>> {
    return this.service.getDissolution(token, session)
  }

  private async isAlreadyPaid(dissolutionSession: DissolutionSession, token: string): Promise<boolean> {
    const dissolution: Optional<DissolutionGetResponse> = await this.getDissolution(dissolutionSession, token)

    return dissolution!.application_status === ApplicationStatus.PAID
  }
}
