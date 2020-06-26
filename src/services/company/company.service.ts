import 'reflect-metadata'

import { CompanyProfile } from 'ch-sdk-node/dist/services/company-profile/types'
import Resource from 'ch-sdk-node/dist/services/resource'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import CompanyProfileClient from '../clients/companyProfile.client'

import CompanyDetailsMapper from 'app/mappers/company/companyDetails.mapper'
import CompanyDetails from 'app/models/companyDetails.model'

@provide(CompanyService)
export default class CompanyService {

  public constructor(
    @inject(CompanyProfileClient) private client: CompanyProfileClient,
    @inject(CompanyDetailsMapper) private companyMapper: CompanyDetailsMapper) {}

  public async doesCompanyExist(token: string, companyNumber: string): Promise<boolean> {
    const response: Resource<CompanyProfile> = await this.client.getCompanyProfile(token, companyNumber)
    return !!response.resource
  }

  public async getCompanyDetails(token: string, companyNumber: string): Promise<CompanyDetails> {
    const response: Resource<CompanyProfile> = await this.client.getCompanyProfile(token, companyNumber)

    if (!response.resource) {
      return Promise.reject(`No profile found for company [${companyNumber}]`)
    }

    return this.companyMapper.mapToCompanyDetails(response.resource)
  }
}
