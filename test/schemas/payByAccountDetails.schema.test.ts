// noinspection DuplicatedCode

import { ValidationResult } from "@hapi/joi"
import { assert } from "chai"
import { generatePayByAccountDetailsForm } from "../fixtures/payment.fixtures"

import PayByAccountDetailsFormModel from "app/models/form/payByAccountDetails.model"
import payByAccountDetailsSchema from "app/schemas/payByAccountDetails.schema"

describe("Pay By Account Schema", () => {
    it("should return no errors when data is valid", () => {
        const validForm: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm()
        const errors: ValidationResult = payByAccountDetailsSchema.validate(validForm)
        assert.isUndefined(errors.error)
    })

    it("should return an error when a presenter ID is not provided", () => {
        const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm()
        form.presenterId = undefined

        const errors: ValidationResult = payByAccountDetailsSchema.validate(form)

        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 1)
        assert.equal(errors.error!.details[0].context!.key, "presenterId")
        assert.equal(errors.error!.details[0].type, `any.required`)
        assert.equal(errors.error!.details[0].message, "Enter your presenter ID")
    })

    it("should return an error when an empty presenter ID is provided", () => {
        const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm()
        form.presenterId = ""

        const errors: ValidationResult = payByAccountDetailsSchema.validate(form)

        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 1)
        assert.equal(errors.error!.details[0].context!.key, "presenterId")
        assert.equal(errors.error!.details[0].type, `string.empty`)
        assert.equal(errors.error!.details[0].message, "Enter your presenter ID")
    })

    it("should return an error when Presenter ID contains invalid characters", () => {
        const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm()
        form.presenterId = "ABC4567890"

        const errors: ValidationResult = payByAccountDetailsSchema.validate(form)
        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 1)
        assert.equal(errors.error!.details[0].context!.key, "presenterId")
        assert.equal(errors.error!.details[0].type, `string.pattern.base`)
        assert.equal(errors.error!.details[0].message, "Presenter ID must only include numbers")
    })

    it("should return an error when presenter ID is less than 11 characters", () => {
        const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm()
        form.presenterId = "123456789"

        const errors: ValidationResult = payByAccountDetailsSchema.validate(form)
        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 1)
        assert.equal(errors.error!.details[0].context!.key, "presenterId")
        assert.equal(errors.error!.details[0].type, `string.length`)
        assert.equal(errors.error!.details[0].message, "Presenter ID must be 11 numbers")
    })

    it("should return an error when presenter ID is more than 11 characters", () => {
        const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm()
        form.presenterId = "123456789012"

        const errors: ValidationResult = payByAccountDetailsSchema.validate(form)
        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 1)
        assert.equal(errors.error!.details[0].context!.key, "presenterId")
        assert.equal(errors.error!.details[0].type, `string.length`)
        assert.equal(errors.error!.details[0].message, "Presenter ID must be 11 numbers")
    })

    it("should return an error when a presenter auth code is not provided", () => {
        const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm()
        form.presenterAuthCode = undefined

        const errors: ValidationResult = payByAccountDetailsSchema.validate(form)

        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 1)
        assert.equal(errors.error!.details[0].context!.key, "presenterAuthCode")
        assert.equal(errors.error!.details[0].type, `any.required`)
        assert.equal(errors.error!.details[0].message, "Enter your presenter authentication code")
    })

    it("should return an error when an empty presenter auth code is provided", () => {
        const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm()
        form.presenterAuthCode = ""

        const errors: ValidationResult = payByAccountDetailsSchema.validate(form)

        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 1)
        assert.equal(errors.error!.details[0].context!.key, "presenterAuthCode")
        assert.equal(errors.error!.details[0].type, `string.empty`)
        assert.equal(errors.error!.details[0].message, "Enter your presenter authentication code")
    })

    it("should return an error when presenter auth code contains invalid characters", () => {
        const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm()
        form.presenterAuthCode = "1234*67890@"

        const errors: ValidationResult = payByAccountDetailsSchema.validate(form)

        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 1)
        assert.equal(errors.error!.details[0].context!.key, "presenterAuthCode")
        assert.equal(errors.error!.details[0].type, `string.alphanum`)
        assert.equal(errors.error!.details[0].message, "Presenter authentication code must only include letters a to z, and numbers")
    })

    it("should return an error when presenter auth code is less than 11 characters", () => {
        const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm()
        form.presenterAuthCode = "123456789"

        const errors: ValidationResult = payByAccountDetailsSchema.validate(form)
        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 1)
        assert.equal(errors.error!.details[0].context!.key, "presenterAuthCode")
        assert.equal(errors.error!.details[0].type, `string.length`)
        assert.equal(errors.error!.details[0].message, "Presenter authentication code must be 11 characters")
    })

    it("should return an error when presenter auth code is more than 11 characters", () => {
        const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm()
        form.presenterAuthCode = "123456789012"

        const errors: ValidationResult = payByAccountDetailsSchema.validate(form)
        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 1)
        assert.equal(errors.error!.details[0].context!.key, "presenterAuthCode")
        assert.equal(errors.error!.details[0].type, `string.length`)
        assert.equal(errors.error!.details[0].message, "Presenter authentication code must be 11 characters")
    })

})
