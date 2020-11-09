import { assert } from 'chai'

import PayByAccountMapper from 'app/mappers/payment/payByAccount.mapper'
import PresenterAuthRequest from 'app/models/dto/presenterAuthRequest'
import PayByAccountDetailsFormModel from 'app/models/form/payByAccountDetails.model'

import { generatePayByAccountDetailsForm } from 'test/fixtures/payment.fixtures'

describe('PayByAccountMapper', () => {

  const mapper: PayByAccountMapper = new PayByAccountMapper()

  describe('mapToPresenterAuthRequest', () => {
    it('should map the pay by account details to a presenter auth request', () => {
      const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm()
      form.presenterId = '1234'
      form.presenterAuthCode = 'ABC123'

      const result: PresenterAuthRequest = mapper.mapToPresenterAuthRequest(form)

      assert.equal(result.id, '1234')
      assert.equal(result.auth, 'ABC123')
    })
  })
})
