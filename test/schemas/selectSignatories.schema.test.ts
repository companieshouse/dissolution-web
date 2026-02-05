import { ValidationResult } from "@hapi/joi"
import { assert } from "chai"
import { generateSelectSignatoriesFormModel } from "../fixtures/companyOfficers.fixtures"

import OfficerType from "app/models/dto/officerType.enum"
import SelectSignatoriesFormModel from "app/models/form/selectSignatories.model"
import selectSignatoriesSchema from "app/schemas/selectSignatories.schema"

describe("Select Signatories Schema", () => {

    it("should return no errors when data is valid", () => {
        const validForm: SelectSignatoriesFormModel = generateSelectSignatoriesFormModel("123")
        const errors: ValidationResult = selectSignatoriesSchema(OfficerType.DIRECTOR, 1).validate(validForm)
        assert.isUndefined(errors.error)
    })

    const cases = [
        { officerType: OfficerType.DIRECTOR, isApplicantADirector: false, expected: "Select the directors who will sign the application." },
        { officerType: OfficerType.MEMBER,   isApplicantADirector: false, expected: "Select the members who will sign the application." },
        { officerType: OfficerType.DIRECTOR, isApplicantADirector: true,  expected: "Select the other directors who will sign the application." },
        { officerType: OfficerType.MEMBER,   isApplicantADirector: true,  expected: "Select the other members who will sign the application." }
    ]

    function assertRequiredMessage(officerType: OfficerType, minSignatories: number, isApplicantADirector: boolean, expected: string) {
        const invalidForm: SelectSignatoriesFormModel = generateSelectSignatoriesFormModel()
        invalidForm.signatories = undefined

        const errors: ValidationResult = selectSignatoriesSchema(officerType, minSignatories, isApplicantADirector).validate(invalidForm)

        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 1)
        assert.equal(errors.error!.details[0].context!.key, "signatories")
        assert.equal(errors.error!.details[0].type, `any.required`)
        assert.equal(errors.error!.details[0].message, expected)
    }

    cases.forEach(c => {
        it(`returns required error for ${c.officerType} (isApplicantADirector=${c.isApplicantADirector})`, () => {
            assertRequiredMessage(c.officerType, 3, c.isApplicantADirector, c.expected)
        })
    })

    const minSignatoryCases = [
        { officerType: OfficerType.DIRECTOR, expected: "Select 3 or more directors who will sign the application." },
        { officerType: OfficerType.MEMBER, expected: "Select 3 or more members who will sign the application." }
    ]

    minSignatoryCases.forEach(c => {
        it(`returns array.min error for ${c.officerType}`, () => {
            const invalidForm: SelectSignatoriesFormModel = generateSelectSignatoriesFormModel("123", "456")

            const errors: ValidationResult = selectSignatoriesSchema(c.officerType, 3).validate(invalidForm)

            assert.isDefined(errors.error)
            assert.equal(errors.error!.details.length, 1)
            assert.equal(errors.error!.details[0].context!.key, "signatories")
            assert.equal(errors.error!.details[0].type, `array.min`)
            assert.equal(errors.error!.details[0].message, c.expected)
        })
    })
})
