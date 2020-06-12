import 'reflect-metadata'

import { CompanyProfile } from 'ch-sdk-node/dist/services/company-profile/types'
import Resource from 'ch-sdk-node/dist/services/resource'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import APIClient from '../clients/api.client'

@provide(CompanyProfileClient)
export default class CompanyProfileClient {

  public constructor(@inject(APIClient) private client: APIClient) {}

  public async getCompanyProfile(token: string, companyNumber: string): Promise<Resource<CompanyProfile>> {
    return this.client
      .getCompanyProfileService(token)
      .getCompanyProfile(companyNumber)
  }
}
