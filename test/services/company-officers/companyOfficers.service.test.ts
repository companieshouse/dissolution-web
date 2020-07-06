import { CompanyOfficer, CompanyOfficers } from 'ch-sdk-node/dist/services/company-officers/types'
import Resource from 'ch-sdk-node/dist/services/resource'
import { assert } from 'chai'
import { NOT_FOUND, OK } from 'http-status-codes'
import { anything, instance, mock, verify, when } from 'ts-mockito'
import { generateCompanyOfficer, generateCompanyOfficers, generateCompanyOfficersResource,
  generateDirectorDetails } from '../../fixtures/companyOfficers.fixtures'

import DirectorDetailsMapper from 'app/mappers/company-officers/directorDetails.mapper'
import DirectorDetails from 'app/models/view/directorDetails.model'
import CompanyOfficersClient from 'app/services/clients/companyOfficers.client'
import CompanyOfficersService from 'app/services/company-officers/companyOfficers.service'

describe('CompanyOfficersService', () => {

  let service: CompanyOfficersService

  let client: CompanyOfficersClient
  let directorMapper: DirectorDetailsMapper

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '12345678'

  beforeEach(() => {
    client = mock(CompanyOfficersClient)
    directorMapper = mock(DirectorDetailsMapper)

    service = new CompanyOfficersService(
      instance(client),
      instance(directorMapper)
    )
  })

  describe('getActiveDirectorsForCompany', () => {
    it('should reject with an error if it fails to fetch the officers for the provided company', async () => {
      const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
      response.httpStatusCode = NOT_FOUND
      response.resource = undefined

      when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)

      try {
        await service.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)
        assert.fail()
      } catch (err) {
        assert.equal(err, 'No officers found for company [12345678]')
      }
    })

    it('should filter out officers who are not directors', async () => {
      const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
      response.httpStatusCode = OK

      const secretary: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: 'secretary' }
      const director: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: 'director' }
      const manager: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: 'cicmanager' }

      response.resource = {
        ...generateCompanyOfficers(),
        items: [secretary, director, manager]
      }

      when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)

      await service.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)

      verify(directorMapper.mapToDirectorDetails(anything())).once()
      verify(directorMapper.mapToDirectorDetails(director)).once()
    })

    it('should filter directors who have resigned', async () => {
      const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
      response.httpStatusCode = OK

      const active1: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: 'director' }
      const resigned: CompanyOfficer = {
        ...generateCompanyOfficer(),
        officerRole: 'director',
        resignedOn: new Date().toISOString()
      }
      const active2: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: 'director' }

      response.resource = {
        ...generateCompanyOfficers(),
        items: [active1, resigned, active2]
      }

      when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)

      await service.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)

      verify(directorMapper.mapToDirectorDetails(anything())).twice()
      verify(directorMapper.mapToDirectorDetails(active1)).once()
      verify(directorMapper.mapToDirectorDetails(active2)).once()
    })

    it('should map the director details of each active director and return them', async () => {
      const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
      response.httpStatusCode = OK

      const director1: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: 'director' }
      const director2: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: 'director' }

      response.resource = {
        ...generateCompanyOfficers(),
        items: [director1, director2]
      }

      const director1Details: DirectorDetails = generateDirectorDetails()
      const director2Details: DirectorDetails = generateDirectorDetails()

      when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)
      when(directorMapper.mapToDirectorDetails(director1)).thenReturn(director1Details)
      when(directorMapper.mapToDirectorDetails(director2)).thenReturn(director2Details)

      const result: DirectorDetails[] = await service.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)

      assert.equal(result.length, 2)
      assert.equal(result[0], director1Details)
      assert.equal(result[1], director2Details)
    })

    it('should should exclude a director if provided', async () => {
      const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
      response.httpStatusCode = OK

      const director1: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: 'director' }
      const director2: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: 'director' }

      response.resource = {
        ...generateCompanyOfficers(),
        items: [director1, director2]
      }

      const director1Details: DirectorDetails = { ...generateDirectorDetails(), id: '123' }
      const director2Details: DirectorDetails = { ...generateDirectorDetails(), id: '456' }

      when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)
      when(directorMapper.mapToDirectorDetails(director1)).thenReturn(director1Details)
      when(directorMapper.mapToDirectorDetails(director2)).thenReturn(director2Details)

      const result: DirectorDetails[] = await service.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER, '123')

      assert.equal(result.length, 1)
      assert.equal(result[0], director2Details)
    })
  })

  describe('getMinimumNumberOfSignatores', () => {
    it(`should calculate the majority of signatories to select if the applicant is a director and there is an even number of total
      directors`, () => {
      const result: number = service.getMinimumNumberOfSignatores(5, '123')

      assert.equal(result, 3)
    })

    it(`should calculate the majority of signatories to select if the applicant is not a director and there is an even number of total
      directors`, () => {
      const result: number = service.getMinimumNumberOfSignatores(6, 'other')

      assert.equal(result, 4)
    })

    it(`should calculate the majority of signatories to select if the applicant is a director and there is an odd number of total
      directors`, () => {
      const result: number = service.getMinimumNumberOfSignatores(4, '123')

      assert.equal(result, 2)
    })

    it(`should calculate the majority of signatories to select if the applicant is not a director and there is an odd number of total
      directors`, () => {
      const result: number = service.getMinimumNumberOfSignatores(5, 'other')

      assert.equal(result, 3)
    })

    it(`should ensure that all signatories must be selected if company only has 2 directors and applicant is not a director`, () => {
      const result: number = service.getMinimumNumberOfSignatores(2, 'other')

      assert.equal(result, 2)
    })

    it(`should ensure that all signatories must be selected if company only has 2 directors and applicant is a director`, () => {
      const result: number = service.getMinimumNumberOfSignatores(1, 'other')

      assert.equal(result, 1)
    })
  })
})
