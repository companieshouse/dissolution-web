import "reflect-metadata"

import { assert } from "chai"
import { anything, capture, instance, mock, verify, when } from "ts-mockito"

import ApprovalService from "app/services/approval/approval.service"
import CompanyOfficersService from "app/services/company-officers/companyOfficers.service"
import DissolutionSessionMapper from "app/mappers/session/dissolutionSession.mapper"
import OfficerRole from "app/models/dto/officerRole.enum"
import { DirectorToSign } from "app/models/session/directorToSign.model"

import { generateApprovalModel, generateDissolutionGetResponse, generateGetDirector } from "../../fixtures/dissolutionApi.fixtures"
import { TOKEN } from "../../fixtures/session.fixtures"

describe("ApprovalService", () => {

    let service: ApprovalService
    let companyOfficersService: CompanyOfficersService
    let mapper: DissolutionSessionMapper

    beforeEach(() => {
        companyOfficersService = mock(CompanyOfficersService)
        mapper = mock(DissolutionSessionMapper)

        service = new ApprovalService(
            instance(companyOfficersService),
            instance(mapper)
        )
    })

    it("should use session director officerRole when available", async () => {
        const dissolution = generateDissolutionGetResponse()
        const signatory = generateGetDirector()

        const found: DirectorToSign = { id: signatory.officer_id, name: signatory.name, isApplicant: false, officerRole: OfficerRole.CORPORATE_DIRECTOR }
        const sessionDirectors: DirectorToSign[] = [found]

        const approval = generateApprovalModel()
        when(mapper.mapToApprovalModel(dissolution, signatory, anything())).thenReturn(approval)

        const result = await service.getApprovalModel(TOKEN, dissolution, signatory, sessionDirectors)

        assert.equal(result, approval)
        verify(companyOfficersService.isCorporateOfficer(anything(), anything(), anything())).never()

        const last = capture(mapper.mapToApprovalModel).last()
        const patch = last[2]
        assert.isDefined(patch)
        assert.isTrue(patch!.isCorporateOfficer)
    })

    it("should fall back to API when session directors are not available", async () => {
        const dissolution = generateDissolutionGetResponse()
        const signatory = generateGetDirector()

        const approval = generateApprovalModel()

        when(companyOfficersService.isCorporateOfficer(TOKEN, dissolution.company_number, signatory.officer_id)).thenResolve(true)
        when(mapper.mapToApprovalModel(dissolution, signatory, anything())).thenReturn(approval)

        const result = await service.getApprovalModel(TOKEN, dissolution, signatory)

        assert.equal(result, approval)
        verify(companyOfficersService.isCorporateOfficer(TOKEN, dissolution.company_number, signatory.officer_id)).once()

        const last = capture(mapper.mapToApprovalModel).last()
        const patch = last[2]
        assert.isDefined(patch)
        assert.isTrue(patch!.isCorporateOfficer)
    })

})
