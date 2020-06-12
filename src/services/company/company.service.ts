import 'reflect-metadata'

import { CompanyProfile } from 'ch-sdk-node/dist/services/company-profile/types'
import Resource from 'ch-sdk-node/dist/services/resource'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import CompanyProfileClient from '../clients/companyProfile.client'

@provide(CompanyService)
export default class CompanyService {

  public constructor(@inject(CompanyProfileClient) private client: CompanyProfileClient) {}

  public async doesCompanyExist(token: string, companyNumber: string): Promise<boolean> {
     const response: Resource<CompanyProfile> = await this.client.getCompanyProfile(token, companyNumber)

    return !!response.resource
  }
}
