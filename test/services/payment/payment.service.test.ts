import { CreatePaymentRequest, Payment } from 'ch-sdk-node/dist/services/payment'
import { ApiResponse, ApiResult } from 'ch-sdk-node/dist/services/resource'
import { assert } from 'chai'
import { anything, instance, mock, verify, when } from 'ts-mockito'
import { generateCreatePaymentRequest, generatePaymentResult } from '../../fixtures/payment.fixtures'

import PaymentMapper from 'app/mappers/payment/payment.mapper'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import PaymentApiClient from 'app/services/clients/paymentApi.client'
import PaymentService from 'app/services/payment/payment.service'

import { generateDissolutionSession } from 'test/fixtures/session.fixtures'

describe('PaymentService', () => {
  let mapper: PaymentMapper
  let client: PaymentApiClient

  let service: PaymentService

  const CHS_URL = 'http://some-ui-url'
  const DISSOLUTIONS_API_URL = 'http://some-dissolutions-api-url'

  let dissolutionSession: DissolutionSession

  const TOKEN = 'some-token'

  const createPaymentRequest: CreatePaymentRequest = generateCreatePaymentRequest()
  const paymentResult: ApiResult<ApiResponse<Payment>> = generatePaymentResult()
  let paymentResponse: ApiResponse<Payment>

  beforeEach(() => {
    mapper = mock(PaymentMapper)
    client = mock(PaymentApiClient)

    dissolutionSession = generateDissolutionSession()

    service = new PaymentService(
      instance(mapper), CHS_URL, DISSOLUTIONS_API_URL, instance(client)
    )

    paymentResponse = paymentResult.value as ApiResponse<Payment>
  })

  describe('generatePaymentURL', () => {
    it('should call the payment api client and return the payment URL', async () => {
      when(
        mapper.mapToCreatePaymentRequest(
          anything(), anything(), anything(), createPaymentRequest.state
        )
      ).thenReturn(createPaymentRequest)
      when(client.createPayment(TOKEN, createPaymentRequest)).thenResolve(paymentResponse)

      const paymentURL: string = await service.generatePaymentURL(TOKEN, dissolutionSession, createPaymentRequest.state)

      assert.equal(paymentURL, `${paymentResponse.resource?.links.journey}?summary=false`)

      verify(client.createPayment(TOKEN, createPaymentRequest)).once()
    })

    it('should reject with an error if payment session failed to create', async () => {
      paymentResponse.resource = undefined

      when(
        mapper.mapToCreatePaymentRequest(
          anything(), anything(), anything(), createPaymentRequest.state
        )
      ).thenReturn(createPaymentRequest)
      when(client.createPayment(TOKEN, createPaymentRequest)).thenResolve(paymentResponse)

      try {
        await service.generatePaymentURL(TOKEN, dissolutionSession, createPaymentRequest.state)
        assert.fail()
      } catch (err) {
        assert.equal(err.message, 'Payment session failed to create')
      }
    })
  })
})
