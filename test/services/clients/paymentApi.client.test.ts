import { CreatePaymentRequest, Payment, PaymentService } from '@companieshouse/api-sdk-node/dist/services/payment'
import { ApiResponse, ApiResult } from '@companieshouse/api-sdk-node/dist/services/resource'
import { assert } from 'chai'
import { instance, mock, when } from 'ts-mockito'
import { generateCreatePaymentRequest, generatePaymentResult } from '../../fixtures/payment.fixtures'

import APIClientFactory from 'app/services/clients/apiClient.factory'
import PaymentApiClient from 'app/services/clients/paymentApi.client'

describe('PaymentApiClient', () => {

  let paymentApiClient: PaymentApiClient

  let factory: APIClientFactory
  let paymentService: PaymentService

  const TOKEN = 'some-token'

  beforeEach(() => {
    factory = mock(APIClientFactory)
    paymentService = mock(PaymentService)

    paymentApiClient = new PaymentApiClient(instance(factory))
  })

  describe('createPayment', () => {
    it('should fetch and return the payment details for the provided payment request', async () => {
      const createPaymentRequest: CreatePaymentRequest = generateCreatePaymentRequest()
      const paymentResult: ApiResult<ApiResponse<Payment>> = generatePaymentResult()

      when(factory.getPaymentService(TOKEN)).thenReturn(instance(paymentService))
      when(paymentService.createPayment(createPaymentRequest)).thenResolve(paymentResult)

      const paymentResponse: ApiResponse<Payment> = await paymentApiClient.createPayment(TOKEN, createPaymentRequest)

      assert.equal(paymentResponse, paymentResult.value)
    })
  })
})
