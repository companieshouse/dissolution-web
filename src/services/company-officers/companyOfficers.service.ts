import 'reflect-metadata'

import { CompanyOfficer, CompanyOfficers } from 'ch-sdk-node/dist/services/company-officers/types'
import Resource from 'ch-sdk-node/dist/services/resource'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import CompanyOfficersClient from '../clients/companyOfficers.client'

import DirectorDetailsMapper from 'app/mappers/company-officers/directorDetails.mapper'
import DirectorDetails from 'app/models/view/directorDetails.model'

@provide(CompanyOfficersService)
export default class CompanyOfficersService {

  public constructor(
    @inject(CompanyOfficersClient) private client: CompanyOfficersClient,
    @inject(DirectorDetailsMapper) private directorMapper: DirectorDetailsMapper) {}

  public async getActiveDirectorsForCompany(token: string, companyNumber: string, directorToExclude?: string): Promise<DirectorDetails[]> {
    const response: Resource<CompanyOfficers> = await this.client.getCompanyOfficers(token, companyNumber)

    if (!response.resource) {
      return Promise.reject(`No officers found for company [${companyNumber}]`)
    }

    const activeDirectors: DirectorDetails[] = response.resource!.items
      .filter((officer: CompanyOfficer) => officer.officerRole === 'director')
      .filter((director: CompanyOfficer) => !director.resignedOn)
      .map((activeDirector: CompanyOfficer) => this.directorMapper.mapToDirectorDetails(activeDirector))

    return directorToExclude ? this.exclueDirector(activeDirectors, directorToExclude) : activeDirectors
  }

  private exclueDirector(activeDirectors: DirectorDetails[], directorToExclude: string): DirectorDetails[] {
    return activeDirectors.filter(activeDirector => activeDirector.id !== directorToExclude)
  }

  public getMinimumNumberOfSignatores(totalSignatories: number, selectedDirector: string): number {
    const isApplicantADirector: boolean = selectedDirector !== 'other'
    const totalActiveDirectors: number = isApplicantADirector ? totalSignatories + 1 : totalSignatories

    const majority: number = Math.floor(((totalActiveDirectors / 2) + 1))

    return isApplicantADirector ? majority - 1 : majority
  }
}
