import { CompanyProfile } from 'ch-sdk-node/dist/services/company-profile/types'
import Resource from 'ch-sdk-node/dist/services/resource'
import { assert } from 'chai'
import { NOT_FOUND, OK } from 'http-status-codes'
import { instance, mock, when } from 'ts-mockito'
import { generateCompanyProfile, generateCompanyProfileResource } from '../../fixtures/companyProfile.fixtures'

import CompanyProfileClient from 'app/services/clients/companyProfile.client'
import CompanyService from 'app/services/company/company.service'

describe('CompanyService', () => {

  let service: CompanyService

  let client: CompanyProfileClient

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '12345678'

  beforeEach(() => {
    client = mock(CompanyProfileClient)

    service = new CompanyService(instance(client))
  })

  describe('doesCompanyExist', () => {
    it('should return true if a company exists with the provided company number', async () => {
      const response: Resource<CompanyProfile> = generateCompanyProfileResource()
      response.httpStatusCode = OK
      response.resource = generateCompanyProfile()

      when(client.getCompanyProfile(TOKEN, COMPANY_NUMBER)).thenResolve(response)

      const result: boolean = await service.doesCompanyExist(TOKEN, COMPANY_NUMBER)

      assert.isTrue(result)
    })

    it('should return false if a company does not exist with the provided company number', async () => {
      const response: Resource<CompanyProfile> = generateCompanyProfileResource()
      response.httpStatusCode = NOT_FOUND
      response.resource = undefined

      when(client.getCompanyProfile(TOKEN, COMPANY_NUMBER)).thenResolve(response)

      const result: boolean = await service.doesCompanyExist(TOKEN, COMPANY_NUMBER)

      assert.isFalse(result)
    })
  })
})
