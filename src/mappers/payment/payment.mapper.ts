import 'reflect-metadata'

import { CreatePaymentRequest } from '@companieshouse/api-sdk-node/dist/services/payment'
import { provide } from 'inversify-binding-decorators'

import DissolutionGetPaymentUIData from 'app/models/dto/dissolutionGetPaymentUIData'
import Payment from 'app/models/dto/paymentDetails'
import PaymentItem from 'app/models/dto/paymentItem'
import PaymentSummary from 'app/models/dto/paymentSummary'
import convertToCurrency from 'app/utils/currencyConverter.util'

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

  public mapToPaymentSummary(dissolutionGetPaymentUIData: DissolutionGetPaymentUIData): PaymentSummary {
    const totalCost: number = dissolutionGetPaymentUIData.items.reduce(
      (total: number, paymentItem: PaymentItem) => total + Number(paymentItem.amount), 0
    )

    return {
      payments: dissolutionGetPaymentUIData.items.map(this.mapToPayment),
      total_cost: convertToCurrency(totalCost)
    }
  }

  private mapToPayment(paymentItem: PaymentItem): Payment {
    return {
      description: paymentItem.description,
      cost: convertToCurrency(Number(paymentItem.amount))
    }
  }
}
