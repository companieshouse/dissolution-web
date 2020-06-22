import 'reflect-metadata'

import { createApiClient } from 'ch-sdk-node'
import CompanyOfficersService from 'ch-sdk-node/dist/services/company-officers/service'
import CompanyProfileService from 'ch-sdk-node/dist/services/company-profile/service'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'

import TYPES from 'app/types'

@provide(APIClientFactory)
export default class APIClientFactory {

  public constructor(@inject(TYPES.CHS_COMPANY_PROFILE_API_LOCAL_URL) private companyProfileUrl: string) {}

  public getCompanyProfileService(token: string): CompanyProfileService {
    return createApiClient(undefined, token, this.companyProfileUrl).companyProfile
  }

  public getCompanyOfficersService(token: string): CompanyOfficersService {
    return createApiClient(undefined, token).companyOfficers
  }
}
