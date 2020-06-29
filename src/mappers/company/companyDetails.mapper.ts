import 'reflect-metadata'

import { CompanyProfile } from 'ch-sdk-node/dist/services/company-profile/types'
import { provide } from 'inversify-binding-decorators'

import CompanyDetails from 'app/models/companyDetails.model'

@provide(CompanyDetailsMapper)
export default class CompanyDetailsMapper {

  public mapToCompanyDetails(company: CompanyProfile): CompanyDetails {
    return {
      companyNumber: company.companyNumber,
      companyName: company.companyName,
      companyStatus: company.companyStatus,
      companyIncDate: company.dateOfCreation,
      companyType: company.type,
      companyRegOffice: this.getCompanyAddress(company),
      canClose: this.canClose(company)
    }
  }

  private getCompanyAddress(company: CompanyProfile): string {
    return [company.registeredOfficeAddress.addressLineOne,
      company.registeredOfficeAddress.addressLineTwo,
      company.registeredOfficeAddress.careOf,
      company.registeredOfficeAddress.country,
      company.registeredOfficeAddress.locality,
      company.registeredOfficeAddress.poBox,
      company.registeredOfficeAddress.postalCode,
      company.registeredOfficeAddress.premises,
      company.registeredOfficeAddress.region]
    .filter(el => el != null && el.trim() !== '')
    .join(', ')
  }

  private canClose(company: CompanyProfile): boolean {
    const closableCompanyTypes = ['ltd', 'plc']
    return company.companyStatus === 'active' && closableCompanyTypes.includes(company.type)
  }
}