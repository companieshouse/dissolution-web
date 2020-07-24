import 'reflect-metadata'

import { CreatePaymentRequest } from 'ch-sdk-node/dist/services/payment'
import { provide } from 'inversify-binding-decorators'

@provide(PaymentMapper)
export default class PaymentMapper {

  public mapToCreatePaymentRequest(
    paymentRedirectURI: string, applicationReferenceNumber: string, paymentResource: string, paymentStateUUID: string
  ): CreatePaymentRequest {
    return {
      redirectUri: paymentRedirectURI,
      reference: applicationReferenceNumber,
      resource: paymentResource,
      state: paymentStateUUID
    }
  }
}
