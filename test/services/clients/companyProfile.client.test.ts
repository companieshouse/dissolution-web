import CompanyProfileService from 'api-sdk-node/dist/services/company-profile/service'
import { CompanyProfile } from 'api-sdk-node/dist/services/company-profile/types'
import Resource from 'api-sdk-node/dist/services/resource'
import { assert } from 'chai'
import { instance, mock, when } from 'ts-mockito'
import { generateCompanyProfileResource } from '../../fixtures/companyProfile.fixtures'

import APIClientFactory from 'app/services/clients/apiClient.factory'
import CompanyProfileClient from 'app/services/clients/companyProfile.client'

describe('CompanyProfileClient', () => {

  let companyProfileClient: CompanyProfileClient

  let factory: APIClientFactory
  let companyProfileService: CompanyProfileService

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '12345678'

  beforeEach(() => {
    factory = mock(APIClientFactory)
    companyProfileService = mock(CompanyProfileService)

    companyProfileClient = new CompanyProfileClient(instance(factory))
  })

  describe('getCompanyProfile', () => {
    it('should fetch and return the company profile for the provided company number', async () => {
      const response: Resource<CompanyProfile> = generateCompanyProfileResource()

      when(companyProfileService.getCompanyProfile(COMPANY_NUMBER)).thenResolve(response)
      when(factory.getCompanyProfileService(TOKEN)).thenReturn(instance(companyProfileService))

      const result: Resource<CompanyProfile> = await companyProfileClient.getCompanyProfile(TOKEN, COMPANY_NUMBER)

      assert.equal(result, response)
    })
  })
})
