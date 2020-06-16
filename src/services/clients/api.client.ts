import 'reflect-metadata'

import { createApiClient } from 'ch-sdk-node'
import CompanyProfileService from 'ch-sdk-node/dist/services/company-profile/service'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'

import TYPES from 'app/types'

@provide(APIClient)
export default class APIClient {

  public constructor(@inject(TYPES.CHS_COMPANY_PROFILE_API_LOCAL_URL) private companyProfileUrl: string) {}

  public getCompanyProfileService(token: string): CompanyProfileService {
    return createApiClient(undefined, token, this.companyProfileUrl).companyProfile
  }
}
