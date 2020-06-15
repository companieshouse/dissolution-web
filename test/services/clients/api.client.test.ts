import CompanyProfileService from 'ch-sdk-node/dist/services/company-profile/service'
import { assert } from 'chai'

import APIClient from 'app/services/clients/api.client'

describe('APIClient', () => {

  let apiClient: APIClient

  const TOKEN = 'some-token'
  const COMPANY_PROFILE_API_URL = 'some-company-profile-url'

  beforeEach(() => apiClient = new APIClient(COMPANY_PROFILE_API_URL))

  describe('getCompanyProfileService', () => {
    it('should return an instance of the CH company profile service', () => {
      const result: CompanyProfileService = apiClient.getCompanyProfileService(TOKEN)

      assert.instanceOf(result, CompanyProfileService)
    })
  })
})
