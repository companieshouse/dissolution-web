import { CreatePaymentRequest } from '@companieshouse/api-sdk-node/dist/services/payment'
import { assert } from 'chai'
import { generateDissolutionGetPaymentUIData, generateDissolutionPaymentPatchRequest } from '../../fixtures/dissolutionApi.fixtures'
import { generateCreatePaymentRequest, generatePaymentSummary } from '../../fixtures/payment.fixtures'
import { generateDissolutionSession } from '../../fixtures/session.fixtures'

import PaymentMapper from 'app/mappers/payment/payment.mapper'
import DissolutionGetPaymentUIData from 'app/models/dto/dissolutionGetPaymentUIData'
import DissolutionPaymentPatchRequest from 'app/models/dto/dissolutionPaymentPatchRequest'
import PaymentSummary from 'app/models/dto/paymentSummary'
import PaymentType from 'app/models/dto/paymentType.enum'
import DissolutionSession from 'app/models/session/dissolutionSession.model'

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

  describe('mapToPayByAccountPaymentPatchRequest', () => {
    it('should map the data to a pay by account payment patch request object', () => {
      const accountNumber: string = '222222'

      const dissolutionSession: DissolutionSession = generateDissolutionSession()
      dissolutionSession.paymentType = PaymentType.ACCOUNT
      const dissolutionPaymentPatchRequest: DissolutionPaymentPatchRequest = generateDissolutionPaymentPatchRequest()

      const result: DissolutionPaymentPatchRequest = mapper.mapToPayByAccountPaymentPatchRequest(dissolutionSession, accountNumber)

      assert.equal(result.status, dissolutionPaymentPatchRequest.status)
      assert.isUndefined(result.payment_reference)
      assert.isNotNull(result.paid_at)
      assert.equal(result.payment_method, dissolutionPaymentPatchRequest.payment_method)
      assert.equal(result.account_number, dissolutionPaymentPatchRequest.account_number)
    })
  })
})
