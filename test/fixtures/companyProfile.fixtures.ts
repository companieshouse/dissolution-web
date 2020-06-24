import { Accounts, CompanyProfile, ConfirmationStatement, RegisteredOfficeAddress } from 'ch-sdk-node/dist/services/company-profile/types'
import Resource from 'ch-sdk-node/dist/services/resource'
import { OK } from 'http-status-codes'

import SearchCompanyFormModel from 'app/models/form/searchCompany.model'

export function generateCompanyProfileResource(): Resource<CompanyProfile> {
  return {
    httpStatusCode: OK,
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
    type: 'plc',
    hasCharges: false,
    hasInsolvencyHistory: false,
    registeredOfficeAddress: generateRegisteredOfficeAddress(),
    accounts: generateAccounts(),
    confirmationStatement: generateConfirmationStatement()
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
