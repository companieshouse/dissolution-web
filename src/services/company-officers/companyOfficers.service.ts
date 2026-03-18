import "reflect-metadata"

import { CompanyOfficer, CompanyOfficers } from "@companieshouse/api-sdk-node/dist/services/company-officers/types"
import Resource from "@companieshouse/api-sdk-node/dist/services/resource"
import { inject } from "inversify"
import { provide } from "inversify-binding-decorators"
import CompanyOfficersClient from "../clients/companyOfficers.client"

import DirectorDetailsMapper from "app/mappers/company-officers/directorDetails.mapper"
import OfficerRole, { isCorporateOfficer } from "app/models/dto/officerRole.enum"
import DirectorDetails from "app/models/view/directorDetails.model"

@provide(CompanyOfficersService)
export default class CompanyOfficersService {

    private readonly VALID_OFFICER_ROLES: string[] = [
        OfficerRole.DIRECTOR,
        OfficerRole.CORPORATE_DIRECTOR,
        OfficerRole.CORPORATE_NOMINEE_DIRECTOR,
        OfficerRole.JUDICIAL_FACTOR,
        OfficerRole.LLP_MEMBER,
        OfficerRole.LLP_DESIGNATED_MEMBER,
        OfficerRole.CORPORATE_LLP_MEMBER,
        OfficerRole.CORPORATE_LLP_DESIGNATED_MEMBER
    ]

    public constructor (
    @inject(CompanyOfficersClient) private client: CompanyOfficersClient,
    @inject(DirectorDetailsMapper) private directorMapper: DirectorDetailsMapper) {}

    public async getActiveDirectorsForCompany (token: string, companyNumber: string, directorToExclude?: string): Promise<DirectorDetails[]> {
        const response: Resource<CompanyOfficers> = await this.client.getCompanyOfficers(token, companyNumber)

        if (!response.resource) {
            return Promise.reject(`No officers found for company [${companyNumber}]`)
        }

        const activeDirectors: DirectorDetails[] = response.resource.items
            .filter((officer: CompanyOfficer) => this.VALID_OFFICER_ROLES.includes(officer.officerRole) && !officer.resignedOn)
            .map((activeDirector: CompanyOfficer) => this.directorMapper.mapToDirectorDetails(activeDirector))

        return directorToExclude ? this.excludeDirector(activeDirectors, directorToExclude) : activeDirectors
    }

    private excludeDirector (activeDirectors: DirectorDetails[], directorToExclude: string): DirectorDetails[] {
        return activeDirectors.filter(activeDirector => activeDirector.id !== directorToExclude)
    }

    /**
     * Get the officer role for a specific officer ID by fetching all officers and matching the ID.
     * Optionally accepts a pre-fetched officers list to avoid redundant API calls.
     * @param token the auth token
     * @param companyNumber the company number
     * @param officerId the officer ID
     * @param officersList optional pre-fetched officers list
     * @returns the officer role or undefined
     */
    public async getOfficerRoleById(token: string, companyNumber: string, officerId: string, officersList?: CompanyOfficer[]): Promise<OfficerRole | undefined> {
        const officers = officersList ?? (await (async () => {
            const response: Resource<CompanyOfficers> = await this.client.getCompanyOfficers(token, companyNumber)
            if (!response.resource) return undefined
            return response.resource.items
        })());

        const officer = officers?.find((item: CompanyOfficer) => this.extractOfficerId(item) === officerId);
        if (!officer) {
            console.warn(`[WARN] Officer not found for officerId: ${officerId} in company: ${companyNumber}`);
            return undefined;
        }
        return officer.officerRole as OfficerRole;
    }

    /**
     * Determine if the officer is a corporate officer by their ID.
     * Optionally accepts a pre-fetched officers list to avoid redundant API calls.
     * @param token the auth token
     * @param companyNumber the company number
     * @param officerId the officer ID
     * @param officersList optional pre-fetched officers list
     * @returns true if the officer is a corporate officer, false otherwise
     */
    public async isCorporateOfficer(token: string, companyNumber: string, officerId: string, officersList?: CompanyOfficer[]): Promise<boolean> {
        const officerRole = await this.getOfficerRoleById(token, companyNumber, officerId, officersList)
        return officerRole ? isCorporateOfficer(officerRole) : false
    }
    
    /**
     * Extract the officer ID from a CompanyOfficer object.
     * @param officer the CompanyOfficer object
     * @returns the officer ID string or undefined
     */
    private extractOfficerId(officer: CompanyOfficer): string | undefined {
        return officer.links?.officer?.appointments
            ? officer.links.officer.appointments.split("/")[2]
            : undefined
    }
}
