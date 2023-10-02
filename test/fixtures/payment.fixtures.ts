import { CreatePaymentRequest, Payment } from "@companieshouse/api-sdk-node/dist/services/payment"
import { ApiResponse, ApiResult } from "@companieshouse/api-sdk-node/dist/services/resource"
import { StatusCodes } from "http-status-codes"

import PaymentDetails from "app/models/dto/paymentDetails"
import PaymentSummary from "app/models/dto/paymentSummary"
import PaymentType from "app/models/dto/paymentType.enum"
import PresenterAuthRequest from "app/models/dto/presenterAuthRequest"
import PresenterAuthResponse from "app/models/dto/presenterAuthResponse"
import HowDoYouWantToPayFormModel from "app/models/form/howDoYouWantToPay.model"
import PayByAccountDetailsFormModel from "app/models/form/payByAccountDetails.model"

export function generateCreatePaymentRequest (): CreatePaymentRequest {
    return {
        redirectUri: "http://some-payment-callback-url",
        reference: "ABC123",
        resource: "http://some-dissolution-pai-payment-endpoint",
        state: "some-payment-uuid"
    }
}

export function generatePaymentResult (): ApiResult<ApiResponse<Payment>> {
    return {
        value: {
            httpStatusCode: StatusCodes.CREATED,
            headers: {},
            resource: generatePayment()
        },
        isFailure (): void { },
        isSuccess (): void { }
    }
}

export function generatePayment (): Payment {
    return {
        amount: "some cost amount",
        availablePaymentMethods: ["credit-card"],
        companyNumber: "C123",
        completedAt: "12-12-20",
        createdAt: "12-12-20",
        createdBy: {
            email: "email",
            forename: "forname",
            id: "0000001",
            surname: "surname"
        },
        description: "description",
        etag: "etag",
        kind: "kind",
        links: {
            journey: "journey",
            resource: "resource",
            self: "payment-session#payment-session"
        },
        paymentMethod: "credit-card",
        reference: "reference",
        status: "paid"
    }
}

export function generatePaymentSummary (): PaymentSummary {
    return {
        payments: [generatePaymentDetails(), generatePaymentDetails()],
        total_cost: "£58.00"
    }
}

function generatePaymentDetails (): PaymentDetails {
    return {
        description: "Some payment description",
        cost: "£29.00"
    }
}

export function generatePayByAccountDetailsForm (): PayByAccountDetailsFormModel {
    return {
        presenterId: "1234",
        presenterAuthCode: "ABC123"
    }
}

export function generatePresenterAuthRequest (): PresenterAuthRequest {
    return {
        id: "1234",
        auth: "ABC123"
    }
}

export function generatePresenterAuthResponse (): PresenterAuthResponse {
    return {
        presenterAccountNumber: "1234567890"
    }
}

export function generateHowDoYouWantToPayForm (): HowDoYouWantToPayFormModel {
    return {
        paymentType: PaymentType.CREDIT_DEBIT_CARD
    }
}
