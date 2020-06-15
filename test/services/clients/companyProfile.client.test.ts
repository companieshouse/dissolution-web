import CompanyProfileService from 'ch-sdk-node/dist/services/company-profile/service'
import { CompanyProfile } from 'ch-sdk-node/dist/services/company-profile/types'
import Resource from 'ch-sdk-node/dist/services/resource'
import { assert } from 'chai'
import { instance, mock, when } from 'ts-mockito'
import { generateCompanyProfileResource } from '../../fixtures/company.fixtures'

import APIClient from 'app/services/clients/api.client'
import CompanyProfileClient from 'app/services/clients/companyProfile.client'

describe('CompanyProfileClient', () => {

  let companyProfileClient: CompanyProfileClient

  let apiClient: APIClient
  let companyProfileService: CompanyProfileService

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '12345678'

  beforeEach(() => {
    apiClient = mock(APIClient)
    companyProfileService = mock(CompanyProfileService)

    companyProfileClient = new CompanyProfileClient(instance(apiClient))
  })

  describe('getCompanyProfile', () => {
    it('should fetch and return the company profile for the provided company number', async () => {
      const response: Resource<CompanyProfile> = generateCompanyProfileResource()

      when(companyProfileService.getCompanyProfile(COMPANY_NUMBER)).thenResolve(response)
      when(apiClient.getCompanyProfileService(TOKEN)).thenReturn(instance(companyProfileService))

      const result: Resource<CompanyProfile> = await companyProfileClient.getCompanyProfile(TOKEN, COMPANY_NUMBER)

      assert.equal(result, response)
    })
  })
})
