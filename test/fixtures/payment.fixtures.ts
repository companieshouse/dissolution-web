import { CreatePaymentRequest, Payment } from '@companieshouse/api-sdk-node/dist/services/payment'
import { ApiResponse, ApiResult } from '@companieshouse/api-sdk-node/dist/services/resource'
import { CREATED } from 'http-status-codes'

export function generateCreatePaymentRequest(): CreatePaymentRequest {
  return {
    redirectUri: 'http://some-payment-callback-url',
    reference: 'ABC123',
    resource: 'http://some-dissolution-pai-payment-endpoint',
    state: 'some-payment-uuid'
  }
}

export function generatePaymentResult(): ApiResult<ApiResponse<Payment>> {
  return {
    value: {
      httpStatusCode: CREATED,
      headers: {},
      resource: generatePayment()
    },
    isFailure(): void { return },
    isSuccess(): void { return }
  }
}

export function generatePayment(): Payment {
  return {
    amount: 'some cost amount',
    availablePaymentMethods: ['credit-card'],
    companyNumber: 'C123',
    completedAt: '12-12-20',
    createdAt: '12-12-20',
    createdBy: {
      email: 'email',
      forename: 'forname',
      id: '0000001',
      surname: 'surname',
    },
    description: 'description',
    etag: 'etag',
    kind: 'kind',
    links: {
      journey: 'journey',
      resource: 'resource',
      self: 'payment-session#payment-session',
    },
    paymentMethod: 'credit-card',
    reference: 'reference',
    status: 'paid'
  }
}
