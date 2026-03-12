import "reflect-metadata"

import { inject } from "inversify"
import { provide } from "inversify-binding-decorators"

import CompanyOfficersService from "app/services/company-officers/companyOfficers.service"
import DissolutionSessionMapper from "app/mappers/session/dissolutionSession.mapper"
import DissolutionGetDirector from "app/models/dto/dissolutionGetDirector"
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse"
import DissolutionApprovalModel from "app/models/form/dissolutionApproval.model"
import { DirectorToSign } from "app/models/session/directorToSign.model"
import { isCorporateOfficer } from "app/models/dto/officerRole.enum"

@provide(ApprovalService)
export default class ApprovalService {

    public constructor(
        @inject(CompanyOfficersService) private readonly companyOfficersService: CompanyOfficersService,
        @inject(DissolutionSessionMapper) private readonly mapper: DissolutionSessionMapper
    ) { }

    /**
     * Builds the approval model for a specific signatory. 
     * 
     * This method will attempt to determine if the signatory is a corporate officer using the provided session 
     * directors list, and will fall back to an API call if the information is not available in the session.
     * 
     * @param token the auth token
     * @param dissolution the dissolution response
     * @param signatory the signatory for whom to get the approval model
     * @param sessionDirectors optional list of directors from the session
     * @returns the dissolution approval model
     */
    public async getApprovalModel(
        token: string, dissolution: DissolutionGetResponse, signatory: DissolutionGetDirector, sessionDirectors?: DirectorToSign[]): Promise<DissolutionApprovalModel> {
        // Derive officer role from officers in session (if available)
        const sessionOfficerRole = sessionDirectors?.find(d => d.id === signatory.officer_id)?.officerRole
        if (sessionOfficerRole) {
            const corporate = isCorporateOfficer(sessionOfficerRole)
            return this.mapper.mapToApprovalModel(dissolution, signatory, { isCorporateOfficer: corporate })
        }

        // Fall back to API call to determine officer role if not found in session
        const corporateOfficerStatus = await this.companyOfficersService.isCorporateOfficer(
            token,
            dissolution.company_number,
            signatory.officer_id
        )

        return this.mapper.mapToApprovalModel(dissolution, signatory, { isCorporateOfficer: corporateOfficerStatus })
    }
}
