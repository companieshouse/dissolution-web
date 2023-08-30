import "reflect-metadata"

import { CreatePaymentRequest } from "@companieshouse/api-sdk-node/dist/services/payment"
import { provide } from "inversify-binding-decorators"

import DissolutionGetPaymentUIData from "app/models/dto/dissolutionGetPaymentUIData"
import DissolutionPaymentPatchRequest from "app/models/dto/dissolutionPaymentPatchRequest"
import Payment from "app/models/dto/paymentDetails"
import PaymentItem from "app/models/dto/paymentItem"
import PaymentStatus from "app/models/dto/paymentStatus.enum"
import PaymentSummary from "app/models/dto/paymentSummary"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import convertToCurrency from "app/utils/currencyConverter.util"

@provide(PaymentMapper)
export default class PaymentMapper {

    public mapToCreatePaymentRequest (
        paymentRedirectURI: string, applicationReferenceNumber: string, paymentResource: string, paymentStateUUID: string
    ): CreatePaymentRequest {
        return {
            redirectUri: paymentRedirectURI,
            reference: applicationReferenceNumber,
            resource: paymentResource,
            state: paymentStateUUID
        }
    }

    public mapToPaymentSummary (dissolutionGetPaymentUIData: DissolutionGetPaymentUIData): PaymentSummary {
        const totalCost: number = this.calculateTotalCostOfPaymentItems(dissolutionGetPaymentUIData.items)

        return {
            payments: dissolutionGetPaymentUIData.items.map(this.mapToPayment),
            total_cost: convertToCurrency(totalCost)
        }
    }

    public mapToPayByAccountPaymentPatchRequest (
        dissolutionSession: DissolutionSession, accountNumber: string
    ): DissolutionPaymentPatchRequest {
        return {
            status: PaymentStatus.PAID,
            paid_at: new Date(),
            payment_method: dissolutionSession.paymentType,
            account_number: accountNumber
        }
    }

    public mapToPaymentReferencePatchRequest (paymentRef: string): DissolutionPaymentPatchRequest {
        return {
            payment_reference: paymentRef
        }
    }

    private calculateTotalCostOfPaymentItems (paymentItems: PaymentItem[]): number {
        return paymentItems.reduce(
            (totalCost: number, paymentItem: PaymentItem) => totalCost + Number(paymentItem.amount), 0
        )
    }

    private mapToPayment (paymentItem: PaymentItem): Payment {
        return {
            description: paymentItem.description,
            cost: convertToCurrency(Number(paymentItem.amount))
        }
    }
}
