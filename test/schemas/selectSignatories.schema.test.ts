import { ValidationResult } from "@hapi/joi"
import { assert } from "chai"
import { generateSelectSignatoriesFormModel } from "../fixtures/companyOfficers.fixtures"

import OfficerType from "app/models/dto/officerType.enum"
import SelectSignatoriesFormModel from "app/models/form/selectSignatories.model"
import selectSignatoriesSchema from "app/schemas/selectSignatories.schema"

describe("Select Signatories Schema", () => {
    describe("No errors (valid input)", () => {
        it("should pass validation when signatories are valid", () => {
            const validForm: SelectSignatoriesFormModel = generateSelectSignatoriesFormModel("123")
            const errors: ValidationResult = selectSignatoriesSchema(OfficerType.DIRECTOR, 1, true).validate(validForm)
            assert.isUndefined(errors.error)
        })
    })

    describe("Signatories required errors", () => {
        const requiredCases = [
            { officerType: OfficerType.DIRECTOR, isApplicantADirector: false, expected: "Select the directors who will sign the application." },
            { officerType: OfficerType.MEMBER, isApplicantADirector: false, expected: "Select the members who will sign the application." },
            { officerType: OfficerType.DIRECTOR, isApplicantADirector: true, expected: "Select the other directors who will sign the application." },
            { officerType: OfficerType.MEMBER, isApplicantADirector: true, expected: "Select the other members who will sign the application." }
        ]

        requiredCases.forEach(c => {
            it(`should show required error for signatories (${c.officerType}, isApplicantADirector=${c.isApplicantADirector})`, () => {
                const invalidForm: SelectSignatoriesFormModel = generateSelectSignatoriesFormModel()
                invalidForm.signatories = undefined
                const errors: ValidationResult = selectSignatoriesSchema(c.officerType, 3, c.isApplicantADirector).validate(invalidForm)
                assert.isDefined(errors.error)
                assert.equal(errors.error!.details.length, 1)
                assert.equal(errors.error!.details[0].context!.key, "signatories")
                assert.equal(errors.error!.details[0].type, `any.required`)
                assert.equal(errors.error!.details[0].message, c.expected)
            })
        })
    })

    describe("Minimum number of signatories required errors", () => {
        const minSignatoryCases = [
            { officerType: OfficerType.DIRECTOR, expected: "Select 3 or more directors who will sign the application." },
            { officerType: OfficerType.MEMBER, expected: "Select 3 or more members who will sign the application." }
        ]

        minSignatoryCases.forEach(c => {
            it(`should show minimum signatories error for ${c.officerType}`, () => {
                const invalidForm: SelectSignatoriesFormModel = generateSelectSignatoriesFormModel("123", "456")
                const errors: ValidationResult = selectSignatoriesSchema(c.officerType, 3, false).validate(invalidForm)
                assert.isDefined(errors.error)
                assert.equal(errors.error!.details.length, 1)
                assert.equal(errors.error!.details[0].context!.key, "signatories")
                assert.equal(errors.error!.details[0].type, `array.min`)
                assert.equal(errors.error!.details[0].message, c.expected)
            })
        })
    })
})
