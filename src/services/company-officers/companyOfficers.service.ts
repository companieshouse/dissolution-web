import 'reflect-metadata'

import { CompanyOfficer, CompanyOfficers } from 'ch-sdk-node/dist/services/company-officers/types'
import Resource from 'ch-sdk-node/dist/services/resource'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import CompanyOfficersClient from '../clients/companyOfficers.client'

import DirectorDetailsMapper from 'app/mappers/company-officers/directorDetails.mapper'
import OfficerRole from 'app/models/dto/officerRole.enum'
import DirectorDetails from 'app/models/view/directorDetails.model'

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

  public constructor(
    @inject(CompanyOfficersClient) private client: CompanyOfficersClient,
    @inject(DirectorDetailsMapper) private directorMapper: DirectorDetailsMapper) {}

  public async getActiveDirectorsForCompany(token: string, companyNumber: string, directorToExclude?: string): Promise<DirectorDetails[]> {
    const response: Resource<CompanyOfficers> = await this.client.getCompanyOfficers(token, companyNumber)

    if (!response.resource) {
      return Promise.reject(`No officers found for company [${companyNumber}]`)
    }

    const activeDirectors: DirectorDetails[] = response.resource.items
      .filter((officer: CompanyOfficer) => this.VALID_OFFICER_ROLES.includes(officer.officerRole) && !officer.resignedOn)
      .map((activeDirector: CompanyOfficer) => this.directorMapper.mapToDirectorDetails(activeDirector))

    return directorToExclude ? this.excludeDirector(activeDirectors, directorToExclude) : activeDirectors
  }

  private excludeDirector(activeDirectors: DirectorDetails[], directorToExclude: string): DirectorDetails[] {
    return activeDirectors.filter(activeDirector => activeDirector.id !== directorToExclude)
  }
}
