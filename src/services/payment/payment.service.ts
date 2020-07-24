import 'reflect-metadata'

import ApplicationLogger from 'ch-logging/lib/ApplicationLogger'
import { CreatePaymentRequest, Payment } from 'ch-sdk-node/dist/services/payment'
import { ApiResponse } from 'ch-sdk-node/dist/services/resource'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import PaymentApiClient from '../clients/paymentApi.client'

import PaymentMapper from 'app/mappers/payment/payment.mapper'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { PAYMENT_CALLBACK_URI } from 'app/paths'
import TYPES from 'app/types'

@provide(PaymentService)
export default class PaymentService {

  public constructor(
    @inject(PaymentMapper) private mapper: PaymentMapper,
    @inject(TYPES.CHS_URL) private CHS_URL: string,
    @inject(TYPES.DISSOLUTIONS_API_URL) private DISSOLUTIONS_API_URL: string,
    @inject(PaymentApiClient) private client: PaymentApiClient,
    @inject(ApplicationLogger) private logger: ApplicationLogger
  ) {}

  public async generatePaymentURL(
    token: string, dissolutionSession: DissolutionSession, paymentStateUUID: string
  ): Promise<string> {
    const paymentRedirectURI: string = `${this.CHS_URL}${PAYMENT_CALLBACK_URI}`

    const applicationReferenceNumber: string = dissolutionSession.applicationReferenceNumber!

    const companyNumber: string = dissolutionSession.companyNumber!
    const paymentResource: string = `${this.DISSOLUTIONS_API_URL}/dissolution-request/${companyNumber}/payment`

    const createPaymentRequest: CreatePaymentRequest = this.mapper.mapToCreatePaymentRequest(
      paymentRedirectURI, applicationReferenceNumber, paymentResource, paymentStateUUID
    )

    return this.createPayment(token, createPaymentRequest)
  }

  private async createPayment(token: string, createPaymentRequest: CreatePaymentRequest): Promise<string> {
    try {
      const response: ApiResponse<Payment> = await this.client.createPayment(token, createPaymentRequest)

      return `${response.resource?.links.journey}?summary=false`
    } catch (err) {
      this.logger.error(err)

      return Promise.reject(err)
    }
  }
}
