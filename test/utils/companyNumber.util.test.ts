import "reflect-metadata";

import { assert } from "chai";

import { extractCompanyNumberFromPath, validateCompanyNumber } from "app/utils/companyNumber.util";

describe("CompanyNumber Utilities", () => {
    describe("extractCompanyNumberFromPath", () => {
        it("should extract company number from a valid path", () => {
            const path = "/close-a-company/journey-id/company/12345678/view-company-information";
            const result = extractCompanyNumberFromPath(path);
            assert.equal(result, "12345678");
        });

        it("should extract alphanumeric company numbers", () => {
            const path = "/company/NI123456";
            const result = extractCompanyNumberFromPath(path);
            assert.equal(result, "NI123456");
        });

        it("should throw an error if path does not contain company segment", () => {
            const path = "/close-a-company/journey-id/view-company-information";
            assert.throws(() => extractCompanyNumberFromPath(path), Error, "No company number found in path");
        });

        it("should throw an error if company number is empty", () => {
            const path = "/company//view-company-information";
            assert.throws(() => extractCompanyNumberFromPath(path), Error, "No company number found in path");
        });

        it("should throw an error if company number exceeds 8 characters", () => {
            const path = "/company/123456789/view-company-information";
            assert.throws(() => extractCompanyNumberFromPath(path), Error, "Invalid company number");
        });

        it("should throw an error if company number contains an invalid character", () => {
            const path = "/company/1234-567/view-company-information";
            assert.throws(() => extractCompanyNumberFromPath(path), Error, "Invalid company number");
        });

        it("should throw an error for empty path", () => {
            assert.throws(() => extractCompanyNumberFromPath(""), Error, "No company number found in path");
        });

        it("should extract company number regardless of what comes after", () => {
            const paths = [
                "/company/00000001/",
                "/company/00000001/check-answers",
                "/company/00000001/page?query=value",
            ];
            paths.forEach(path => {
                const result = extractCompanyNumberFromPath(path);
                assert.equal(result, "00000001");
            });
        });

        it("should handle paths with multiple company segments (captures first)", () => {
            const path = "/company/12345678/company/87654321/page";
            const result = extractCompanyNumberFromPath(path);
            assert.equal(result, "12345678");
        });

        it("should extract company number with query string", () => {
            const path = "/company/12345678?query=value";
            const result = extractCompanyNumberFromPath(path);
            assert.equal(result, "12345678");
        });

        it("should extract company number with hash fragment", () => {
            const path = "/company/12345678#section";
            const result = extractCompanyNumberFromPath(path);
            assert.equal(result, "12345678");
        });

        it("should extract company number with query string and hash", () => {
            const path = "/company/NI123456?id=1#top";
            const result = extractCompanyNumberFromPath(path);
            assert.equal(result, "NI123456");
        });

        it("should extract company number if company number is in query string", () => {
            const path = "/search?redirect=/company/00006400";
            const result = extractCompanyNumberFromPath(path);
            assert.equal(result, "00006400");
        });

        it("should throw error if company number contains dot", () => {
            const path = "/company/1234.567/view-company-information";
            assert.throws(() => extractCompanyNumberFromPath(path), Error, "Invalid company number");
        });

        it("should throw error if company number contains underscore", () => {
            const path = "/company/1234_567/view-company-information";
            assert.throws(() => extractCompanyNumberFromPath(path), Error, "Invalid company number");
        });

        it("should throw error if company number contains plus sign", () => {
            const path = "/company/1234+567/view-company-information";
            assert.throws(() => extractCompanyNumberFromPath(path), Error, "Invalid company number");
        });

        it("should throw error if company number contains URL-encoded characters", () => {
            const path = "/company/1234%20567/view-company-information";
            assert.throws(() => extractCompanyNumberFromPath(path), Error, "Invalid company number");
        });
    });

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
