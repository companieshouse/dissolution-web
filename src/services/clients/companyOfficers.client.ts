import 'reflect-metadata'

import { CompanyOfficers } from 'ch-sdk-node/dist/services/company-officers/types'
import Resource from 'ch-sdk-node/dist/services/resource'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import APIClientFactory from './apiClient.factory'

@provide(CompanyOfficersClient)
export default class CompanyOfficersClient {

  public constructor(@inject(APIClientFactory) private factory: APIClientFactory) {}

  public async getCompanyOfficers(token: string, companyNumber: string): Promise<Resource<CompanyOfficers>> {
    return this.factory
      .getCompanyOfficersService(token)
      .getCompanyOfficers(companyNumber)
  }
}
