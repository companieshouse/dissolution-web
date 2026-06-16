import { assert } from "chai";

import { asCompanyTypeText } from "app/filters/asCompanyTypeText.filter";
describe("asEmailLabelFilter", () => {
    it(`should return mapped value if value is present`, () => {
        assert.equal("Limited liability partnership", asCompanyTypeText("llp"));
    });

    it(`should return original value if value is not present`, () => {
        assert.equal("unknown", asCompanyTypeText("unknown"));
    });
});
