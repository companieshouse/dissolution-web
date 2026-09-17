import "reflect-metadata";

import { assert } from "chai";

import { validateCompanyNumber } from "app/utils/companyNumber.util";

describe("CompanyNumber Utilities", () => {
    describe("validateCompanyNumber", () => {
        it("should validate a string company number", () => {
            const { companyNumber, error } = validateCompanyNumber("12345678");
            assert.equal(companyNumber, "12345678");
            assert.isUndefined(error);
        });

        it("should validate a company number from string array", () => {
            const { companyNumber, error } = validateCompanyNumber(["12345678", "87654321"]);
            assert.equal(companyNumber, "12345678");
            assert.isUndefined(error);
        });

        it("should return error for undefined company number", () => {
            const { companyNumber, error } = validateCompanyNumber(undefined);
            assert.isUndefined(companyNumber);
            assert.isDefined(error);
        });

        it("should return error for null company number", () => {
            const { companyNumber, error } = validateCompanyNumber(null as any);
            assert.isUndefined(companyNumber);
            assert.isDefined(error);
        });

        it("should return error for empty string", () => {
            const { companyNumber, error } = validateCompanyNumber("");
            assert.equal(companyNumber, "");
            assert.isDefined(error);
        });

        it("should return error for empty array", () => {
            const { companyNumber, error } = validateCompanyNumber([]);
            assert.isUndefined(companyNumber);
            assert.isDefined(error);
        });

        it("should trim whitespace from company number", () => {
            const { companyNumber, error } = validateCompanyNumber("  12345678  ");
            assert.equal(companyNumber, "12345678");
            assert.isUndefined(error);
        });

        it("should trim whitespace from first element of array", () => {
            const { companyNumber, error } = validateCompanyNumber(["  87654321  ", "12345678"]);
            assert.equal(companyNumber, "87654321");
            assert.isUndefined(error);
        });

        it("should accept alphanumeric company numbers", () => {
            const { companyNumber, error } = validateCompanyNumber("NI123456");
            assert.equal(companyNumber, "NI123456");
            assert.isUndefined(error);
        });
    });
});
