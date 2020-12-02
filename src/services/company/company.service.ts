import 'reflect-metadata'

import { CompanyProfile } from '@companieshouse/api-sdk-node/dist/services/company-profile/types'
import Resource from '@companieshouse/api-sdk-node/dist/services/resource'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import CompanyProfileClient from '../clients/companyProfile.client'

import {
  COMPANY_NOT_ACTIVE_ERROR_MSG,
  COMPANY_OVERSEAS_ERROR_MSG,
  NO_ACTIVE_DIRECTORS_ERROR_MSG, NO_ACTIVE_MEMBERS_ERROR_MSG
} from 'app/constants/app.const'
import { asCompanyTypeText } from 'app/filters/asCompanyTypeText.filter'
import CompanyDetailsMapper from 'app/mappers/company/companyDetails.mapper'
import CompanyDetails from 'app/models/companyDetails.model'
import ClosableCompanyType from 'app/models/mapper/closableCompanyType.enum'
import CompanyStatus from 'app/models/mapper/companyStatus.enum'
import OverseasCompanyPrefix from 'app/models/mapper/overseasCompanyPrefix.enum'
import Optional from 'app/models/optional'
import DirectorDetails from 'app/models/view/directorDetails.model'
import CompanyOfficersService from 'app/services/company-officers/companyOfficers.service'

@provide(CompanyService)
export default class CompanyService {

  public constructor(
    @inject(CompanyProfileClient) private client: CompanyProfileClient,
    @inject(CompanyOfficersService) private companyOfficersService: CompanyOfficersService,
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

  public async validateCompanyDetails(company: CompanyDetails, token: string): Promise<Optional<string>> {
    if (!Object.values(ClosableCompanyType).some(val => val === company.companyType)) {
      return `Company type of ${asCompanyTypeText(company.companyType)} cannot be closed via this service.
              <br><a target="_blank" href="https://www.gov.uk/government/publications/company-strike-off-dissolution-and-restoration/strike-off-dissolution-and-restoration#when-a-company-cannot-apply-to-be-struck-off-the-register"> Read guidance here (opens in new tab)</a>.`
    }

    if (company.companyStatus !== CompanyStatus.ACTIVE) {
      return COMPANY_NOT_ACTIVE_ERROR_MSG
    }

    if (Object.values(OverseasCompanyPrefix).some(invalidPrefix => company.companyNumber.startsWith(invalidPrefix))) {
      return COMPANY_OVERSEAS_ERROR_MSG
    }

    const companyOfficers: DirectorDetails[] = await this.companyOfficersService.getActiveDirectorsForCompany(token, company.companyNumber)

    if (companyOfficers.length === 0) {
      return company.companyType === ClosableCompanyType.LLP ? NO_ACTIVE_MEMBERS_ERROR_MSG : NO_ACTIVE_DIRECTORS_ERROR_MSG
    }

    return null
  }
}
