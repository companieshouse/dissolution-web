import { Accounts, CompanyProfile, ConfirmationStatement, RegisteredOfficeAddress } from '@companieshouse/api-sdk-node/dist/services/company-profile/types'
import Resource from '@companieshouse/api-sdk-node/dist/services/resource'
import { StatusCodes } from 'http-status-codes'

import CompanyDetails from 'app/models/companyDetails.model'
import SearchCompanyFormModel from 'app/models/form/searchCompany.model'
import ClosableCompanyType from 'app/models/mapper/closableCompanyType.enum'

export function generateCompanyProfileResource(): Resource<CompanyProfile> {
  return {
    httpStatusCode: StatusCodes.OK,
    resource: generateCompanyProfile()
  }
}

export function generateCompanyProfile(): CompanyProfile {
  return {
    companyName: 'Test Company',
    companyNumber: '1234',
    companyStatus: 'active',
    companyStatusDetail: 'some active details',
    dateOfCreation: `${new Date()}`,
    jurisdiction: 'some jurisdiction',
    sicCodes:[],
    hasBeenLiquidated: false,
    type: ClosableCompanyType.PLC,
    hasCharges: false,
    hasInsolvencyHistory: false,
    registeredOfficeAddress: generateRegisteredOfficeAddress(),
    accounts: generateAccounts(),
    confirmationStatement: generateConfirmationStatement(),
    links: {}
  }
}

export function generateRegisteredOfficeAddress(): RegisteredOfficeAddress {
  return {
    addressLineOne: 'some street',
    addressLineTwo: 'some area',
    careOf: 'someone',
    country: 'UK',
    locality: 'some locality',
    poBox: 'PO Box 123',
    postalCode: 'ABC123',
    premises: 'some premises',
    region: 'south'
  }
}

export function generateAccounts(): Accounts {
  return {
    nextAccounts: {
      periodEndOn: `${new Date()}`,
      periodStartOn: `${new Date()}`
    },
    nextDue: `${new Date()}`,
    overdue: false
  }
}

export function generateConfirmationStatement(): ConfirmationStatement {
  return {
    nextDue: `${new Date()}`,
    overdue: false
  }
}

export function generateSearchCompanyForm(companyNumber: string = '1234'): SearchCompanyFormModel {
  return {
    companyNumber
  }
}

export function generateCompanyDetails(): CompanyDetails {
  return {
    companyName: 'My Company',
    companyNumber: '1234',
    companyStatus: 'active',
    companyType: ClosableCompanyType.LTD,
    companyIncDate: new Date().toISOString(),
    companyRegOffice: 'Some address',
    canClose: true
  }
}
