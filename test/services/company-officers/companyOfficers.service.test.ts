import { CompanyOfficer, CompanyOfficers } from 'ch-sdk-node/dist/services/company-officers/types'
import Resource from 'ch-sdk-node/dist/services/resource'
import { assert } from 'chai'
import { NOT_FOUND, OK } from 'http-status-codes'
import { anything, instance, mock, verify, when } from 'ts-mockito'
import { generateCompanyOfficer, generateCompanyOfficers, generateCompanyOfficersResource,
  generateDirectorDetails } from '../../fixtures/companyOfficers.fixtures'

import DirectorDetailsMapper from 'app/mappers/company-officers/directorDetails.mapper'
import OfficerRole from 'app/models/dto/officerRole.enum'
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

    it('should filter out officers who are not directors or members', async () => {
      const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
      response.httpStatusCode = OK

      const secretary: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: 'secretary' }
      const director: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.DIRECTOR }
      const manager: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: 'cicmanager' }
      const llpMember: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.LLP_MEMBER }

      response.resource = {
        ...generateCompanyOfficers(),
        items: [secretary, director, manager, llpMember]
      }

      when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)

      await service.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)

      verify(directorMapper.mapToDirectorDetails(anything())).twice()
      verify(directorMapper.mapToDirectorDetails(director)).once()
      verify(directorMapper.mapToDirectorDetails(llpMember)).once()
    })

    it('should filter directors who have resigned', async () => {
      const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
      response.httpStatusCode = OK

      const activeDirector1: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.DIRECTOR }
      const resignedDirector: CompanyOfficer = {
        ...generateCompanyOfficer(),
        officerRole: OfficerRole.DIRECTOR,
        resignedOn: new Date().toISOString()
      }
      const activeDirector2: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.DIRECTOR }

      response.resource = {
        ...generateCompanyOfficers(),
        items: [activeDirector1, resignedDirector, activeDirector2]
      }

      when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)

      await service.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)

      verify(directorMapper.mapToDirectorDetails(anything())).twice()
      verify(directorMapper.mapToDirectorDetails(activeDirector1)).once()
      verify(directorMapper.mapToDirectorDetails(resignedDirector)).never()
      verify(directorMapper.mapToDirectorDetails(activeDirector2)).once()
    })

    it('should filter members who have resigned', async () => {
      const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
      response.httpStatusCode = OK

      const activeMember1: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.LLP_MEMBER }
      const resignedMember: CompanyOfficer = {
        ...generateCompanyOfficer(),
        officerRole: OfficerRole.LLP_MEMBER,
        resignedOn: new Date().toISOString()
      }
      const activeMember2: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.LLP_MEMBER }

      response.resource = {
        ...generateCompanyOfficers(),
        items: [activeMember1, resignedMember, activeMember2]
      }

      when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)

      await service.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)

      verify(directorMapper.mapToDirectorDetails(anything())).twice()
      verify(directorMapper.mapToDirectorDetails(activeMember1)).once()
      verify(directorMapper.mapToDirectorDetails(resignedMember)).never()
      verify(directorMapper.mapToDirectorDetails(activeMember2)).once()
    })

    it('should map the director details of each active director and return them', async () => {
      const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
      response.httpStatusCode = OK

      const director1: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.DIRECTOR }
      const director2: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.DIRECTOR }

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

    it('should map the members details of each active member and return them', async () => {
      const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
      response.httpStatusCode = OK

      const member1: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.LLP_MEMBER }
      const member2: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.LLP_MEMBER }

      response.resource = {
        ...generateCompanyOfficers(),
        items: [member1, member2]
      }

      const member1Details: DirectorDetails = generateDirectorDetails()
      const member2Details: DirectorDetails = generateDirectorDetails()

      when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)
      when(directorMapper.mapToDirectorDetails(member1)).thenReturn(member1Details)
      when(directorMapper.mapToDirectorDetails(member2)).thenReturn(member2Details)

      const result: DirectorDetails[] = await service.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)

      assert.equal(result.length, 2)
      assert.equal(result[0], member1Details)
      assert.equal(result[1], member2Details)
    })

    it('should exclude a director if provided', async () => {
      const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
      response.httpStatusCode = OK

      const director1: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.DIRECTOR }
      const director2: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.DIRECTOR }

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
})
