import { Address, CompanyOfficer, CompanyOfficers, DateOfBirth, FormerName, Identification } from 'ch-sdk-node/dist/services/company-officers/types'
import Resource from 'ch-sdk-node/dist/services/resource'
import { OK } from 'http-status-codes'

import SelectDirectorFormModel from 'app/models/forms/selectDirector.model'
import DirectorDetails from 'app/models/view/directorDetails.model'

export function generateCompanyOfficersResource(): Resource<CompanyOfficers> {
  return {
    httpStatusCode: OK,
    resource: generateCompanyOfficers()
  }
}

export function generateCompanyOfficers(): CompanyOfficers {
  return {
    activeCount: '1',
    etag: 'someEtag',
    inactiveCount: '0',
    itemsPerPage: '1',
    kind: 'officer-list',
    resignedCount: '0',
    startIndex: '0',
    totalResults: '1',
    links: {
      self: 'company/123/officers'
    },
    items: [generateCompanyOfficer()]
  }
}

export function generateCompanyOfficer(): CompanyOfficer {
  return {
    appointedOn: (new Date()).toISOString(),
    occupation: 'director',
    countryOfResidence: 'United Kingdom',
    nationality: 'British',
    name: 'Some Director',
    officerRole: 'director',
    address: generateAddress(),
    dateOfBirth: generateDateOfBirth(),
    formerNames: [generateFormerName()],
    identification: generateIdentification(),
    links: {
      officer: {
        appointments: 'officers/456/appointments'
      }
    }
  }
}

export function generateAddress(): Address {
  return {
    addressLine1: '123 Street',
    addressLine2: 'Some area',
    careOf: 'Some council',
    country: 'United Kingdom',
    locality: 'Wales',
    poBox: '123',
    postalCode: 'SW1',
    premises: 'some premises',
    region: 'South',
  }
}

export function generateDateOfBirth(): DateOfBirth {
  return {
    day: '15',
    month: '4',
    year: '1996'
  }
}

export function generateFormerName(): FormerName {
  return {
    forenames: 'Fore',
    surname: 'Sur'
  }
}

export function generateIdentification(): Identification {
  return {
    identificationType: 'some identification type',
    legalAuthority: 'some legal auth',
    legalForm: 'some legal form',
    placeRegistered: 'some place',
    registrationNumber: 'some reg'
  }
}

export function generateDirectorDetails(): DirectorDetails {
  return {
    id: '123',
    name: 'Some Director'
  }
}

export function generateSelectDirectorFormModel(director: string = '123'): SelectDirectorFormModel {
  return {
    director
  }
}
