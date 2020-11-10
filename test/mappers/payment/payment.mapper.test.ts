import { CreatePaymentRequest } from '@companieshouse/api-sdk-node/dist/services/payment'
import { assert } from 'chai'
import { generateDissolutionGetPaymentUIData } from '../../fixtures/dissolutionApi.fixtures'
import { generateCreatePaymentRequest, generatePaymentSummary } from '../../fixtures/payment.fixtures'

import PaymentMapper from 'app/mappers/payment/payment.mapper'
import DissolutionGetPaymentUIData from 'app/models/dto/dissolutionGetPaymentUIData'
import PaymentSummary from 'app/models/dto/paymentSummary'

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

  describe('mapToPaymentSummary', () => {
    it('should map the dissolution payment UI data to a PaymentSummary object', () => {
      const dissolutionGetPaymentUIData: DissolutionGetPaymentUIData = generateDissolutionGetPaymentUIData()
      const paymentSummary: PaymentSummary = generatePaymentSummary()

      const result: PaymentSummary = mapper.mapToPaymentSummary(
        dissolutionGetPaymentUIData
      )

      assert.deepEqual(result, paymentSummary)
    })
  })
})
