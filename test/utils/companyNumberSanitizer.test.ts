import "reflect-metadata"

import { assert } from "chai"

import CompanyNumberSanitizer from "app/utils/companyNumberSanitizer"

describe("CompanyNumberSanitizer", () => {
    const sanitizer: CompanyNumberSanitizer = new CompanyNumberSanitizer()

    it("should return empty string if company number is empty", () => {
        [" ", "", "\t"].forEach(number => {
            const result: string = sanitizer.sanitizeCompany(number)
            assert.equal(result, "")
        })
    })

    it("should trim whitespaces", () => {
        [" NI000123", "NI000123 ", " NI000123 ", "NI 00 01 23"].forEach(valueWithWhitespaces => {
            const result: string = sanitizer.sanitizeCompany(valueWithWhitespaces)
            assert.equal(result, "NI000123")
        })
    })

    it("should uppercase lowercase characters", () => {
        const result: string = sanitizer.sanitizeCompany("ni000123")
        assert.equal(result, "NI000123")
    })

    it("should pad 4 digits to 8 characters", () => {
        const result: string = sanitizer.sanitizeCompany("1234")
        assert.equal(result, "00001234")
    })

    it("should pad only digits when SC is leading number", () => {
        const result: string = sanitizer.sanitizeCompany("SC1234")
        assert.equal(result, "SC001234")
    })

    it("should pad only digits when NI is leading number", () => {
        const result: string = sanitizer.sanitizeCompany("NI1234")
        assert.equal(result, "NI001234")
    })

    it("should not pad full 8 digit numbers", () => {
        const result: string = sanitizer.sanitizeCompany("12345678")
        assert.equal(result, "12345678")
    })

    it("should not pad full 2 letters and 6 digit numbers", () => {
        const result: string = sanitizer.sanitizeCompany("NI345678")
        assert.equal(result, "NI345678")
    })

    it("should not pad inputs with more than 8 characters", () => {
        const result: string = sanitizer.sanitizeCompany("NI345678213")
        assert.equal(result, "NI345678213")
    })
})
