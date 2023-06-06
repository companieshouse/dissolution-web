import { CreatePaymentRequest, Payment } from '@companieshouse/api-sdk-node/dist/services/payment'
import { ApiResponse, ApiResult } from '@companieshouse/api-sdk-node/dist/services/resource'
import ApplicationLogger from '@companieshouse/structured-logging-node/lib/ApplicationLogger'
import { assert } from 'chai'
import { StatusCodes } from 'http-status-codes'
import { anything, instance, mock, verify, when } from 'ts-mockito'
import { generateCreatePaymentRequest, generatePaymentResult } from '../../fixtures/payment.fixtures'
import { TOKEN } from '../../fixtures/session.fixtures'

import PaymentMapper from 'app/mappers/payment/payment.mapper'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { DissolutionApiClient } from 'app/services/clients/dissolutionApi.client'
import PaymentApiClient from 'app/services/clients/paymentApi.client'
import PaymentService from 'app/services/payment/payment.service'

import { generateDissolutionSession } from 'test/fixtures/session.fixtures'

describe('PaymentService', () => {

  let service: PaymentService

  let mapper: PaymentMapper
  let client: PaymentApiClient
  let dissolutionClient: DissolutionApiClient
  let logger: ApplicationLogger

  const CHS_URL = 'http://some-ui-url'
  const DISSOLUTIONS_API_URL = 'http://some-dissolutions-api-url'

  beforeEach(() => {
    mapper = mock(PaymentMapper)
    client = mock(PaymentApiClient)
    dissolutionClient = mock(dissolutionClient)
    logger = mock(ApplicationLogger)

    service = new PaymentService(
      instance(mapper),
      CHS_URL,
      DISSOLUTIONS_API_URL,
      instance(client),
      instance(logger),
      instance(dissolutionClient)
    )


  })

  describe('generatePaymentURL', () => {
    const APP_REFERENCE: string = 'REF123'

    const createPaymentRequest: CreatePaymentRequest = generateCreatePaymentRequest()
    const paymentResult: ApiResult<ApiResponse<Payment>> = generatePaymentResult()

    let dissolutionSession: DissolutionSession
    let paymentResponse: ApiResponse<Payment>

    beforeEach(() => {
      dissolutionSession = generateDissolutionSession()
      dissolutionSession.applicationReferenceNumber = APP_REFERENCE

      paymentResponse = paymentResult.value as ApiResponse<Payment>
    })

    it('should call the payment api client and return the payment URL', async () => {
      const expectedResource: string = `${DISSOLUTIONS_API_URL}/dissolution-request/${APP_REFERENCE}/payment`

      when(mapper.mapToCreatePaymentRequest(
          anything(), APP_REFERENCE, expectedResource, createPaymentRequest.state
      )).thenReturn(createPaymentRequest)
      when(client.createPayment(TOKEN, createPaymentRequest)).thenResolve(paymentResponse)

      const paymentURL: string = await service.generatePaymentURL(TOKEN, dissolutionSession, createPaymentRequest.state)

      assert.equal(paymentURL, `${paymentResponse.resource!.links.journey}?summary=false`)

      verify(mapper.mapToCreatePaymentRequest(
        anything(), APP_REFERENCE, expectedResource, createPaymentRequest.state
      )).once()
      verify(client.createPayment(TOKEN, createPaymentRequest)).once()
    })

    it('should reject with an error if payment session failed to create', async () => {
      paymentResponse.httpStatusCode = StatusCodes.INTERNAL_SERVER_ERROR

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
        // @ts-ignore
        assert.equal(err.message, 'Payment session failed to create')
      }
    })
  })
})
