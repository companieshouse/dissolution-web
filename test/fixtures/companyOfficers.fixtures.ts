import { Address, CompanyOfficer, CompanyOfficers, DateOfBirth, FormerName, Identification } from "@companieshouse/api-sdk-node/dist/services/company-officers/types";
import Resource from "@companieshouse/api-sdk-node/dist/services/resource";
import { StatusCodes } from "http-status-codes";

import ChangeDetailsFormModel from "app/models/form/changeDetails.model";
import { DefineSignatoryInfoFormModel } from "app/models/form/defineSignatoryInfo.model";
import SelectDirectorFormModel from "app/models/form/selectDirector.model";
import SelectSignatoriesFormModel from "app/models/form/selectSignatories.model";
import SignatorySigning from "app/models/form/signatorySigning.enum";
import DirectorDetails from "app/models/view/directorDetails.model";

export function generateCompanyOfficersResource (): Resource<CompanyOfficers> {
    return {
        httpStatusCode: StatusCodes.OK,
        resource: generateCompanyOfficers()
    };
}

export function generateCompanyOfficers (): CompanyOfficers {
    return {
        activeCount: "1",
        etag: "someEtag",
        inactiveCount: "0",
        itemsPerPage: "1",
        kind: "officer-list",
        resignedCount: "0",
        startIndex: "0",
        totalResults: "1",
        links: {
            self: "company/123/officers"
        },
        items: [generateCompanyOfficer()]
    };
}

export function generateCompanyOfficer (): CompanyOfficer {
    return {
        appointedOn: (new Date()).toISOString(),
        occupation: "director",
        countryOfResidence: "United Kingdom",
        nationality: "British",
        name: "Some Director",
        officerRole: "director",
        address: generateAddress(),
        dateOfBirth: generateDateOfBirth(),
        formerNames: [generateFormerName()],
        identification: generateIdentification(),
        links: {
            self: "/test/link",
            officer: {
                appointments: "officers/456/appointments"
            }
        },
        contactDetails: {
            contactName: "test name"
        }
    };
}

export function generateAddress (): Address {
    return {
        addressLine1: "123 Street",
        addressLine2: "Some area",
        careOf: "Some council",
        country: "United Kingdom",
        locality: "Wales",
        poBox: "123",
        postalCode: "SW1",
        premises: "some premises",
        region: "South"
    };
}

export function generateDateOfBirth (): DateOfBirth {
    return {
        day: "15",
        month: "4",
        year: "1996"
    };
}

export function generateFormerName (): FormerName {
    return {
        forenames: "Fore",
        surname: "Sur"
    };
}

export function generateIdentification (): Identification {
    return {
        identificationType: "some identification type",
        legalAuthority: "some legal auth",
        legalForm: "some legal form",
        placeRegistered: "some place",
        registrationNumber: "some reg"
    };
}

export function generateDirectorDetails (): DirectorDetails {
    return {
        id: "123",
        name: "Some Director"
    };
}

export function generateSelectDirectorFormModel (director: string = "123"): SelectDirectorFormModel {
    return {
        director
    };
}

export function generateSelectSignatoriesFormModel (...signatories: string[]): SelectSignatoriesFormModel {
    return {
        signatories: signatories || ["123"]
    };
}

export function generateDefineSignatoryInfoFormModel (): DefineSignatoryInfoFormModel {
    return {
        isSigning_123abc: SignatorySigning.WILL_SIGN,
        directorEmail_123abc: "director@mail.com",
        isSigning_456def: SignatorySigning.ON_BEHALF,
        onBehalfName_456def: "Mr Accountant",
        onBehalfEmail_456def: "accountant@mail.com"
    };
}

export function generateWillSignChangeDetailsFormModel (): ChangeDetailsFormModel {
    return {
        isSigning: SignatorySigning.WILL_SIGN,
        directorEmail: "director@mail.com"
    };
}

export function generateOnBehalfChangeDetailsFormModel (): ChangeDetailsFormModel {
    return {
        isSigning: SignatorySigning.ON_BEHALF,
        onBehalfName: "Mr Accountant",
        onBehalfEmail: "accountant@mail.com"
    };
}
