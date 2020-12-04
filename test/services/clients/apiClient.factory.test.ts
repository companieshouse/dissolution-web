import CompanyOfficersService from '@companieshouse/api-sdk-node/dist/services/company-officers/service'
import CompanyProfileService from '@companieshouse/api-sdk-node/dist/services/company-profile/service'
import { PaymentService } from '@companieshouse/api-sdk-node/dist/services/payment'
import { assert } from 'chai'
import { TOKEN } from '../../fixtures/session.fixtures'

import APIClientFactory from 'app/services/clients/apiClient.factory'

describe('APIClientFactory', () => {

  let factory: APIClientFactory

  const COMPANY_PROFILE_API_URL = 'http://some-company-profile-url'
  const PAYMENTS_API_URL = 'http://some-payments-api-url'

  beforeEach(() => {
    factory = new APIClientFactory(COMPANY_PROFILE_API_URL, PAYMENTS_API_URL)
  })

  describe('getCompanyProfileService', () => {
    it('should return an instance of the CH company profile service', () => {
      const result: CompanyProfileService = factory.getCompanyProfileService(TOKEN)

      assert.instanceOf(result, CompanyProfileService)
    })
  })

  describe('getCompanyOfficersService', () => {
    it('should return an instance of the CH company officers service', () => {
      const result: CompanyOfficersService = factory.getCompanyOfficersService(TOKEN)

      assert.instanceOf(result, CompanyOfficersService)
    })
  })

  describe('getPaymentService', () => {
    it('should return an instance of the CH payment service', () => {
      const result: PaymentService = factory.getPaymentService(TOKEN)

      assert.instanceOf(result, PaymentService)
    })
  })
})
