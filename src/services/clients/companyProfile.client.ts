import 'reflect-metadata'

import { CompanyProfile } from 'api-sdk-node/dist/services/company-profile/types'
import Resource from 'api-sdk-node/dist/services/resource'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import APIClientFactory from './apiClient.factory'

@provide(CompanyProfileClient)
export default class CompanyProfileClient {

  public constructor(@inject(APIClientFactory) private factory: APIClientFactory) {}

  public async getCompanyProfile(token: string, companyNumber: string): Promise<Resource<CompanyProfile>> {
    return this.factory
      .getCompanyProfileService(token)
      .getCompanyProfile(companyNumber)
  }
}
