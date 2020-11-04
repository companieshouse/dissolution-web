import 'reflect-metadata'

import { CreatePaymentRequest, Payment } from '@companieshouse/api-sdk-node/dist/services/payment'
import { ApiResponse } from '@companieshouse/api-sdk-node/dist/services/resource'
import ApplicationLogger from '@companieshouse/structured-logging-node/lib/ApplicationLogger'
import { StatusCodes } from 'http-status-codes'
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

    const paymentResource: string = `${this.DISSOLUTIONS_API_URL}/dissolution-request/${applicationReferenceNumber}/payment`

    const createPaymentRequest: CreatePaymentRequest = this.mapper.mapToCreatePaymentRequest(
      paymentRedirectURI, applicationReferenceNumber, paymentResource, paymentStateUUID
    )

    const response: ApiResponse<Payment> = await this.client.createPayment(token, createPaymentRequest)

    if (response.httpStatusCode !== StatusCodes.CREATED) {
      this.logger.error(JSON.stringify(response))

      return Promise.reject(new Error('Payment session failed to create'))
    }

    return `${response.resource!.links.journey}?summary=false`
  }
}
