import { CompanyOfficer, CompanyOfficers } from "@companieshouse/api-sdk-node/dist/services/company-officers/types"
import Resource from "@companieshouse/api-sdk-node/dist/services/resource"
import { assert } from "chai"
import { StatusCodes } from "http-status-codes"
import { anything, instance, mock, verify, when } from "ts-mockito"
import {
    generateCompanyOfficer, generateCompanyOfficers, generateCompanyOfficersResource,
    generateDirectorDetails
} from "../../fixtures/companyOfficers.fixtures"
import { TOKEN } from "../../fixtures/session.fixtures"

import DirectorDetailsMapper from "app/mappers/company-officers/directorDetails.mapper"
import OfficerRole from "app/models/dto/officerRole.enum"
import DirectorDetails from "app/models/view/directorDetails.model"
import CompanyOfficersClient from "app/services/clients/companyOfficers.client"
import CompanyOfficersService from "app/services/company-officers/companyOfficers.service"

describe("CompanyOfficersService", () => {

    let service: CompanyOfficersService

    let client: CompanyOfficersClient
    let directorMapper: DirectorDetailsMapper

    const COMPANY_NUMBER = "12345678"

    beforeEach(() => {
        client = mock(CompanyOfficersClient)
        directorMapper = mock(DirectorDetailsMapper)

        service = new CompanyOfficersService(
            instance(client),
            instance(directorMapper)
        )
    })

    describe("getActiveDirectorsForCompany", () => {
        it("should reject with an error if it fails to fetch the officers for the provided company", async () => {
            const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
            response.httpStatusCode = StatusCodes.NOT_FOUND
            response.resource = undefined

            when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)

            try {
                await service.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)
                assert.fail()
            } catch (err) {
                assert.equal(err, "No officers found for company [12345678]")
            }
        })

        it("should filter out officers who are not directors or members", async () => {
            const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
            response.httpStatusCode = StatusCodes.OK

            const secretary: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: "secretary" }
            const director: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.DIRECTOR }
            const corporateDirector: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.CORPORATE_DIRECTOR }
            const corporateNomineeDirector: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.CORPORATE_NOMINEE_DIRECTOR }
            const judicialFactor: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.JUDICIAL_FACTOR }
            const manager: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: "cicmanager" }
            const llpMember: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.LLP_MEMBER }
            const llpDesignatedMember: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.LLP_DESIGNATED_MEMBER }
            const corporateLlpMember: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.CORPORATE_LLP_MEMBER }
            const corporateLlpDesignatedMember: CompanyOfficer = {
                ...generateCompanyOfficer(),
                officerRole: OfficerRole.CORPORATE_LLP_DESIGNATED_MEMBER
            }

            response.resource = {
                ...generateCompanyOfficers(),
                items: [
                    secretary,
                    director,
                    corporateDirector,
                    corporateNomineeDirector,
                    judicialFactor,
                    manager,
                    llpMember,
                    llpDesignatedMember,
                    corporateLlpMember,
                    corporateLlpDesignatedMember
                ]
            }

            when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)

            await service.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)

            verify(directorMapper.mapToDirectorDetails(anything())).times(8)
            verify(directorMapper.mapToDirectorDetails(director)).once()
            verify(directorMapper.mapToDirectorDetails(corporateDirector)).once()
            verify(directorMapper.mapToDirectorDetails(corporateNomineeDirector)).once()
            verify(directorMapper.mapToDirectorDetails(judicialFactor)).once()
            verify(directorMapper.mapToDirectorDetails(llpMember)).once()
            verify(directorMapper.mapToDirectorDetails(llpDesignatedMember)).once()
            verify(directorMapper.mapToDirectorDetails(corporateLlpMember)).once()
            verify(directorMapper.mapToDirectorDetails(corporateLlpDesignatedMember)).once()
        })

        it("should filter directors who have resigned", async () => {
            const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
            response.httpStatusCode = StatusCodes.OK

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

        it("should filter members who have resigned", async () => {
            const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
            response.httpStatusCode = StatusCodes.OK

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

        it("should map the director details of each active director and return them", async () => {
            const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
            response.httpStatusCode = StatusCodes.OK

            const director1: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.DIRECTOR }
            const director2: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.CORPORATE_DIRECTOR }

            response.resource = {
                ...generateCompanyOfficers(),
                items: [director1, director2]
            }

            const director1Details: DirectorDetails = generateDirectorDetails("123", "Director 1", OfficerRole.DIRECTOR)
            const director2Details: DirectorDetails = generateDirectorDetails("456", "Director 2", OfficerRole.CORPORATE_DIRECTOR)

            when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)
            when(directorMapper.mapToDirectorDetails(director1)).thenReturn(director1Details)
            when(directorMapper.mapToDirectorDetails(director2)).thenReturn(director2Details)

            const result: DirectorDetails[] = await service.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)

            assert.equal(result.length, 2)
            assert.equal(result[0], director1Details)
            assert.equal(result[1], director2Details)
        })

        it("should map the members details of each active member and return them", async () => {
            const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
            response.httpStatusCode = StatusCodes.OK

            const member1: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.LLP_MEMBER }
            const member2: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.LLP_DESIGNATED_MEMBER }

            response.resource = {
                ...generateCompanyOfficers(),
                items: [member1, member2]
            }

            const member1Details: DirectorDetails = generateDirectorDetails("789", "Member 1", OfficerRole.LLP_MEMBER)
            const member2Details: DirectorDetails = generateDirectorDetails("101", "Member 2", OfficerRole.LLP_DESIGNATED_MEMBER)

            when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)
            when(directorMapper.mapToDirectorDetails(member1)).thenReturn(member1Details)
            when(directorMapper.mapToDirectorDetails(member2)).thenReturn(member2Details)

            const result: DirectorDetails[] = await service.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)

            assert.equal(result.length, 2)
            assert.equal(result[0], member1Details)
            assert.equal(result[1], member2Details)
        })

        it("should exclude a director if provided", async () => {
            const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
            response.httpStatusCode = StatusCodes.OK

            const director1: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.DIRECTOR }
            const director2: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.DIRECTOR }

            response.resource = {
                ...generateCompanyOfficers(),
                items: [director1, director2]
            }

            const director1Details: DirectorDetails = { ...generateDirectorDetails(), id: "123" }
            const director2Details: DirectorDetails = { ...generateDirectorDetails(), id: "456" }

            when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)
            when(directorMapper.mapToDirectorDetails(director1)).thenReturn(director1Details)
            when(directorMapper.mapToDirectorDetails(director2)).thenReturn(director2Details)

            const result: DirectorDetails[] = await service.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER, "123")

            assert.equal(result.length, 1)
            assert.equal(result[0], director2Details)
        })
    })

    describe("getOfficerRoleById", () => {
        it("should return the officer role for a given officer ID (API fetch)", async () => {
            const officer: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.CORPORATE_DIRECTOR }
            const officers: CompanyOfficer[] = [officer]
            const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
            response.resource = { ...generateCompanyOfficers(), items: officers }
            when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)
            // Officer ID extraction logic
            const officerId = officer.links && officer.links.officer && officer.links.officer.appointments.split("/")[2]
            const result = await service.getOfficerRoleById(TOKEN, COMPANY_NUMBER, officerId!)
            assert.equal(result, OfficerRole.CORPORATE_DIRECTOR)
        })

        it("should return the officer role for a given officer ID (pre-fetched list)", async () => {
            const officer: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.LLP_MEMBER }
            const officers: CompanyOfficer[] = [officer]
            // Officer ID extraction logic
            const officerId = officer.links && officer.links.officer && officer.links.officer.appointments.split("/")[2]
            const result = await service.getOfficerRoleById(TOKEN, COMPANY_NUMBER, officerId!, officers)
            assert.equal(result, OfficerRole.LLP_MEMBER)
        })

        it("should return undefined if officer not found", async () => {
            const officers: CompanyOfficer[] = []
            const result = await service.getOfficerRoleById(TOKEN, COMPANY_NUMBER, "nonexistent", officers)
            assert.isUndefined(result)
        })

        it("should return undefined if API returns no resource", async () => {
            const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
            response.resource = undefined
            when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)
            const result = await service.getOfficerRoleById(TOKEN, COMPANY_NUMBER, "any")
            assert.isUndefined(result)
        })
    })

    describe("isCorporateOfficer", () => {
        it("should return true if officer is corporate (API fetch)", async () => {
            const officer: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.CORPORATE_LLP_MEMBER }
            const officers: CompanyOfficer[] = [officer]
            const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
            response.resource = { ...generateCompanyOfficers(), items: officers }
            when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)
            const officerId = officer.links && officer.links.officer && officer.links.officer.appointments.split("/")[2]
            const result = await service.isCorporateOfficer(TOKEN, COMPANY_NUMBER, officerId!)
            assert.isTrue(result)
        })

        it("should return false if officer is not corporate (pre-fetched list)", async () => {
            const officer: CompanyOfficer = { ...generateCompanyOfficer(), officerRole: OfficerRole.DIRECTOR }
            const officers: CompanyOfficer[] = [officer]
            const officerId = officer.links && officer.links.officer && officer.links.officer.appointments.split("/")[2]
            const result = await service.isCorporateOfficer(TOKEN, COMPANY_NUMBER, officerId!, officers)
            assert.isFalse(result)
        })

        it("should return false if officer not found", async () => {
            const officers: CompanyOfficer[] = []
            const result = await service.isCorporateOfficer(TOKEN, COMPANY_NUMBER, "nonexistent", officers)
            assert.isFalse(result)
        })

        it("should return false if API returns no resource", async () => {
            const response: Resource<CompanyOfficers> = generateCompanyOfficersResource()
            response.resource = undefined
            when(client.getCompanyOfficers(TOKEN, COMPANY_NUMBER)).thenResolve(response)
            const result = await service.isCorporateOfficer(TOKEN, COMPANY_NUMBER, "any")
            assert.isFalse(result)
        })
    })
})
