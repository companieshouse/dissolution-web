import { ValidationResult } from "@hapi/joi"
import { assert } from "chai"
import { generateOnBehalfChangeDetailsFormModel, generateWillSignChangeDetailsFormModel } from "../fixtures/companyOfficers.fixtures"

import OfficerType from "app/models/dto/officerType.enum"
import ChangeDetailsFormModel from "app/models/form/changeDetails.model"
import changeDetailsSchema from "app/schemas/changeDetails.schema"

describe("Change Details Schema", () => {

    it("should return an error when it has not been provided how a signatory will be signing", () => {
        const form: ChangeDetailsFormModel = generateWillSignChangeDetailsFormModel()

        form.isSigning = undefined
        form.directorEmail = "director@mail.com"

        const errors: ValidationResult = changeDetailsSchema(OfficerType.DIRECTOR).validate(form, { abortEarly: false })

        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 1)

        assert.equal(errors.error!.details[0].context!.key, `isSigning`)
        assert.equal(errors.error!.details[0].type, `any.required`)
        assert.equal(errors.error!.details[0].message, `Select how the ${OfficerType.DIRECTOR} will be signing the application`)
    })

    describe("Will sign themselves", () => {
        let form: ChangeDetailsFormModel

        beforeEach(() => form = generateWillSignChangeDetailsFormModel())

        it("should return no errors when data is valid", () => {
            form.directorEmail = "director@mail.com"
            form._csrf = "abc123"
            const errors: ValidationResult = changeDetailsSchema(OfficerType.DIRECTOR).validate(form, { abortEarly: false })
            assert.isUndefined(errors.error)
        })

        it("should return an error if mandatory text field have not been provided", () => {
            form.directorEmail = ""

            const errors: ValidationResult = changeDetailsSchema(OfficerType.MEMBER).validate(form, { abortEarly: false })

            assert.isDefined(errors.error)
            assert.equal(errors.error!.details.length, 1)

            assert.equal(errors.error!.details[0].context!.key, `directorEmail`)
            assert.equal(errors.error!.details[0].type, `string.empty`)
            assert.equal(errors.error!.details[0].message, `Enter the email address for the ${OfficerType.MEMBER}`)
        })

        it("should return an error if email field does not contain a valid email value", () => {
            form.directorEmail = "not an email"

            const errors: ValidationResult = changeDetailsSchema(OfficerType.DIRECTOR).validate(form, { abortEarly: false })

            assert.isDefined(errors.error)
            assert.equal(errors.error!.details.length, 1)

            assert.equal(errors.error!.details[0].context!.key, `directorEmail`)
            assert.equal(errors.error!.details[0].type, `string.email`)
            assert.equal(errors.error!.details[0].message, `Enter a valid email address for the ${OfficerType.DIRECTOR}`)
        })

        it("should ignore invalid fields if the associated radio option has not been selected", () => {
            form.directorEmail = "director@mail.com"
            form.onBehalfName = "X".repeat(500)
            form.onBehalfEmail = "not an email"

            const errors: ValidationResult = changeDetailsSchema(OfficerType.DIRECTOR).validate(form, { abortEarly: false })

            assert.isUndefined(errors.error)
        })
    })

    describe("On behalf", () => {
        let form: ChangeDetailsFormModel

        beforeEach(() => form = generateOnBehalfChangeDetailsFormModel())

        it("should return no errors when data is valid", () => {
            form.onBehalfName = "Mr Accountant"
            form.onBehalfEmail = "accountant@mail.com"

            const errors: ValidationResult = changeDetailsSchema(OfficerType.DIRECTOR).validate(form, { abortEarly: false })

            assert.isUndefined(errors.error)
        })

        it("should return an error if mandatory text fields have not been provided", () => {
            form.onBehalfName = ""
            form.onBehalfEmail = ""

            const errors: ValidationResult = changeDetailsSchema(OfficerType.DIRECTOR).validate(form, { abortEarly: false })

            assert.isDefined(errors.error)
            assert.equal(errors.error!.details.length, 2)

            assert.equal(errors.error!.details[0].context!.key, `onBehalfName`)
            assert.equal(errors.error!.details[0].type, `string.empty`)
            assert.equal(errors.error!.details[0].message, `Enter the name for the person signing on behalf of the ${OfficerType.DIRECTOR}`)

            assert.equal(errors.error!.details[1].context!.key, `onBehalfEmail`)
            assert.equal(errors.error!.details[1].type, `string.empty`)
            assert.equal(errors.error!.details[1].message, `Enter the email address for the person signing on behalf of the ${OfficerType.DIRECTOR}`)
        })

        it("should return an error if email field does not contain a valid email value", () => {
            form.onBehalfName = "Mr Accountant"
            form.onBehalfEmail = "not an email"

            const errors: ValidationResult = changeDetailsSchema(OfficerType.MEMBER).validate(form, { abortEarly: false })

            assert.isDefined(errors.error)
            assert.equal(errors.error!.details.length, 1)

            assert.equal(errors.error!.details[0].context!.key, `onBehalfEmail`)
            assert.equal(errors.error!.details[0].type, `string.email`)
            assert.equal(errors.error!.details[0].message, `Enter a valid email address for the person signing on behalf of the ${OfficerType.MEMBER}`)
        })

        it("should return an error if a name is provided that is above the maximum length", () => {
            form.onBehalfName = "x".repeat(251)
            form.onBehalfEmail = "accountant@mail.com"

            const errors: ValidationResult = changeDetailsSchema(OfficerType.DIRECTOR).validate(form, { abortEarly: false })

            assert.isDefined(errors.error)
            assert.equal(errors.error!.details.length, 1)

            assert.equal(errors.error!.details[0].context!.key, `onBehalfName`)
            assert.equal(errors.error!.details[0].type, `string.max`)
            assert.equal(errors.error!.details[0].message, `Enter a name that is less than 250 characters for the person signing on behalf of the ${OfficerType.DIRECTOR}`)
        })

        it("should ignore invalid fields if the associated radio option has not been selected", () => {
            form.directorEmail = "not an email"
            form.onBehalfName = "Mr Accountant"
            form.onBehalfEmail = "accountant@mail.com"

            const errors: ValidationResult = changeDetailsSchema(OfficerType.DIRECTOR).validate(form, { abortEarly: false })

            assert.isUndefined(errors.error)
        })
    })
})
