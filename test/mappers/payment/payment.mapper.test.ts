import { CreatePaymentRequest } from '@companieshouse/api-sdk-node/dist/services/payment'
import { assert } from 'chai'
import { generateCreatePaymentRequest } from '../../fixtures/payment.fixtures'

import PaymentMapper from 'app/mappers/payment/payment.mapper'

describe('PaymentMapper', () => {

  const mapper: PaymentMapper = new PaymentMapper()

  describe('mapToCreatePaymentRequest', () => {
    it('should map the payment details to a CreatePaymentRequest object', () => {
      const createPaymentRequest: CreatePaymentRequest = generateCreatePaymentRequest()

      const result: CreatePaymentRequest = mapper.mapToCreatePaymentRequest(
        createPaymentRequest.redirectUri,
        createPaymentRequest.reference,
        createPaymentRequest.resource,
        createPaymentRequest.state
      )

      assert.deepEqual(result, createPaymentRequest)
    })
  })
})
