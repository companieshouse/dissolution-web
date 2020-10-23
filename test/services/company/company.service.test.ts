import { CompanyProfile } from '@companieshouse/api-sdk-node/dist/services/company-profile/types'
import Resource from '@companieshouse/api-sdk-node/dist/services/resource'
import { assert } from 'chai'
import { StatusCodes } from 'http-status-codes'
import { instance, mock, when } from 'ts-mockito'
import { generateCompanyDetails, generateCompanyProfile, generateCompanyProfileResource } from '../../fixtures/companyProfile.fixtures'

import CompanyDetailsMapper from 'app/mappers/company/companyDetails.mapper'
import CompanyDetails from 'app/models/companyDetails.model'
import CompanyProfileClient from 'app/services/clients/companyProfile.client'
import CompanyService from 'app/services/company/company.service'

describe('CompanyService', () => {

  let service: CompanyService

  let client: CompanyProfileClient
  let mapper: CompanyDetailsMapper

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '12345678'

  beforeEach(() => {
    client = mock(CompanyProfileClient)
    mapper = mock(CompanyDetailsMapper)

    service = new CompanyService(
      instance(client),
      instance(mapper)
    )
  })

  describe('doesCompanyExist', () => {
    it('should return true if a company exists with the provided company number', async () => {
      const response: Resource<CompanyProfile> = generateCompanyProfileResource()
      response.httpStatusCode = StatusCodes.OK
      response.resource = generateCompanyProfile()

      when(client.getCompanyProfile(TOKEN, COMPANY_NUMBER)).thenResolve(response)

      const result: boolean = await service.doesCompanyExist(TOKEN, COMPANY_NUMBER)

      assert.isTrue(result)
    })

    it('should return false if a company does not exist with the provided company number', async () => {
      const response: Resource<CompanyProfile> = generateCompanyProfileResource()
      response.httpStatusCode = StatusCodes.NOT_FOUND
      response.resource = undefined

      when(client.getCompanyProfile(TOKEN, COMPANY_NUMBER)).thenResolve(response)

      const result: boolean = await service.doesCompanyExist(TOKEN, COMPANY_NUMBER)

      assert.isFalse(result)
    })
  })

  describe('getCompanyDetails', () => {
    it('should reject with an error if company does not exist', async () => {
      const response: Resource<CompanyProfile> = generateCompanyProfileResource()
      response.httpStatusCode = StatusCodes.NOT_FOUND
      response.resource = undefined

      when(client.getCompanyProfile(TOKEN, COMPANY_NUMBER)).thenResolve(response)

      try {
        await service.getCompanyDetails(TOKEN, COMPANY_NUMBER)
        assert.fail()
      } catch (err) {
        assert.equal(err, 'No profile found for company [12345678]')
      }
    })

    it('should map the company to a company details object and return it', async () => {
      const response: Resource<CompanyProfile> = generateCompanyProfileResource()
      response.httpStatusCode = StatusCodes.OK
      response.resource = generateCompanyProfile()

      const companyDetails: CompanyDetails = generateCompanyDetails()

      when(client.getCompanyProfile(TOKEN, COMPANY_NUMBER)).thenResolve(response)
      when(mapper.mapToCompanyDetails(response.resource)).thenReturn(companyDetails)

      const result: CompanyDetails = await service.getCompanyDetails(TOKEN, COMPANY_NUMBER)

      assert.equal(result, companyDetails)
    })
  })
})
