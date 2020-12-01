import { CompanyProfile } from '@companieshouse/api-sdk-node/dist/services/company-profile/types'
import Resource from '@companieshouse/api-sdk-node/dist/services/resource'
import { assert } from 'chai'
import { StatusCodes } from 'http-status-codes'
import { instance, mock, when } from 'ts-mockito'
import { generateCompanyDetails, generateCompanyProfile, generateCompanyProfileResource } from '../../fixtures/companyProfile.fixtures'

import CompanyDetailsMapper from 'app/mappers/company/companyDetails.mapper'
import CompanyDetails from 'app/models/companyDetails.model'
import ClosableCompanyType from 'app/models/mapper/closableCompanyType.enum'
import OverseasCompanyPrefix from 'app/models/mapper/overseasCompanyPrefix.enum'
import Optional from 'app/models/optional'
import DirectorDetails from 'app/models/view/directorDetails.model'
import CompanyProfileClient from 'app/services/clients/companyProfile.client'
import CompanyOfficersService from 'app/services/company-officers/companyOfficers.service'
import CompanyService from 'app/services/company/company.service'

import { generateDirectorDetails } from 'test/fixtures/companyOfficers.fixtures'

describe('CompanyService', () => {

  let service: CompanyService

  let client: CompanyProfileClient
  let mapper: CompanyDetailsMapper
  let officersService: CompanyOfficersService

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '12345678'

  beforeEach(() => {
    client = mock(CompanyProfileClient)
    mapper = mock(CompanyDetailsMapper)
    officersService = mock(CompanyOfficersService)

    service = new CompanyService(
      instance(client),
      instance(officersService),
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

  describe('validateCompanyDetails', () => {
    it('should return null when company is closeable', async () => {

      const companyOfficers: DirectorDetails[] = [generateDirectorDetails()]
      const company: CompanyDetails = generateCompanyDetails()
      company.companyNumber = COMPANY_NUMBER
      company.companyName = 'Some company name'
      company.companyStatus = 'active'
      company.companyType = ClosableCompanyType.LLP

      when(officersService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve(companyOfficers)

      const error: Optional<string> = await service.validateCompanyDetails(company, TOKEN)

      assert.isNull(error)
    })

    it('should return error when company is not of closeable type', async () => {

      const companyOfficers: DirectorDetails[] = [generateDirectorDetails()]
      const company: CompanyDetails = generateCompanyDetails()
      company.companyNumber = COMPANY_NUMBER
      company.companyName = 'Some company name'
      company.companyStatus = 'active'
      company.companyType = 'chicken'

      when(officersService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve(companyOfficers)

      const error: Optional<string> = await service.validateCompanyDetails(company, TOKEN)

      assert.include(error, 'Company type of chicken cannot be closed via this service.')
    })

    it('should return error when company is not active', async () => {

      const companyOfficers: DirectorDetails[] = [generateDirectorDetails()]
      const company: CompanyDetails = generateCompanyDetails()
      company.companyNumber = COMPANY_NUMBER
      company.companyName = 'Some company name'
      company.companyStatus = 'inactive'
      company.companyType = ClosableCompanyType.LLP

      when(officersService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve(companyOfficers)

      const error: Optional<string> = await service.validateCompanyDetails(company, TOKEN)

      assert.equal(error, 'The company is not currently active and cannot be closed.')
    })

    it('should return error when company is an overseas company', async () => {

      const companyOfficers: DirectorDetails[] = [generateDirectorDetails()]
      const company: CompanyDetails = generateCompanyDetails()
      company.companyNumber = OverseasCompanyPrefix.FC + COMPANY_NUMBER
      company.companyName = 'Some company name'
      company.companyStatus = 'active'
      company.companyType = ClosableCompanyType.LLP

      when(officersService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve(companyOfficers)

      const error: Optional<string> = await service.validateCompanyDetails(company, TOKEN)

      assert.equal(error, 'This is an overseas company, and cannot be closed using this service.')
    })

    it('should return error when company is llp has no active members', async () => {

      const companyOfficers: DirectorDetails[] = []
      const company: CompanyDetails = generateCompanyDetails()
      company.companyNumber = COMPANY_NUMBER
      company.companyName = 'Some company name'
      company.companyStatus = 'active'
      company.companyType = ClosableCompanyType.LLP

      when(officersService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve(companyOfficers)

      const error: Optional<string> = await service.validateCompanyDetails(company, TOKEN)

      assert.equal(error, 'The company has no active members.')
    })

    it('should return error when company is not llp has no active directors', async () => {

      const companyOfficers: DirectorDetails[] = []
      const company: CompanyDetails = generateCompanyDetails()
      company.companyNumber = COMPANY_NUMBER
      company.companyName = 'Some company name'
      company.companyStatus = 'active'
      company.companyType = ClosableCompanyType.LTD

      when(officersService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve(companyOfficers)

      const error: Optional<string> = await service.validateCompanyDetails(company, TOKEN)

      assert.equal(error, 'The company has no active directors.')
    })
  })
})
