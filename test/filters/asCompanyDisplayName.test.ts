import { assert } from "chai";

import { asCompanyDisplayName } from "app/filters/asCompanyDisplayName";
import OfficerType from "app/models/dto/officerType.enum";

describe("asCompanyDisplayNameFilter", () => {
    it(`should return "company" if officer type is "director"`, () => {
        assert.equal("company", asCompanyDisplayName(OfficerType.DIRECTOR));
    });

    it(`should return "Company" if officer type is "director" and capitalize is true`, () => {
        assert.equal("Company", asCompanyDisplayName(OfficerType.DIRECTOR, true));
    });

    it(`should return "LLP" if officer type is "member"`, () => {
        assert.equal("LLP", asCompanyDisplayName(OfficerType.MEMBER));
    });

    it(`should return "LLP" if officer type is "member" and capitalize is true`, () => {
        assert.equal("LLP", asCompanyDisplayName(OfficerType.MEMBER));
    });
});
