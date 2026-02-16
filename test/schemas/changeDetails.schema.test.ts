import { ValidationResult } from "@hapi/joi"
import { assert } from "chai"
import ChangeDetailsFormModel from "app/models/form/changeDetails.model"
import changeDetailsSchema from "app/schemas/changeDetails.schema"
import DissolutionGetDirector from "app/models/dto/dissolutionGetDirector"
import { aDissolutionGetDirector } from "test/fixtures/dissolutionGetDirector.builder"
import { aChangeDetailsFormModel } from "test/fixtures/changeDetailsFormModel.builder"

describe("Change Details Schema", () => {

    describe("Standard signatory", () => {

        it("should return no errors when data is valid", () => {

            const signatory: DissolutionGetDirector = aDissolutionGetDirector().withName("Mr Standard Director Signatory").build()
            const form: ChangeDetailsFormModel = aChangeDetailsFormModel()
                .withDirectorEmail("director@mail.com").build()

            const errors: ValidationResult = changeDetailsSchema(signatory).validate(form, { abortEarly: false })
            assert.isUndefined(errors.error)
        })

        it("should return an error if mandatory text field have not been provided", () => {
            const signatory: DissolutionGetDirector = aDissolutionGetDirector().withName("Mr Standard Director Signatory").build()
            const form: ChangeDetailsFormModel = aChangeDetailsFormModel()
                .withDirectorEmail("").build()

            const errors: ValidationResult = changeDetailsSchema(signatory).validate(form, { abortEarly: false })

            assert.isDefined(errors.error)
            assert.equal(errors.error!.details.length, 1)

            assert.equal(errors.error!.details[0].context!.key, `directorEmail`)
            assert.equal(errors.error!.details[0].type, `string.empty`)
            assert.equal(errors.error!.details[0].message, `Enter the email address for Mr Standard Director Signatory`)
        })

        it("should return an error if email field does not contain a valid email value", () => {
            const signatory: DissolutionGetDirector = aDissolutionGetDirector().withName("Mr Standard Director Signatory").build()
            const form: ChangeDetailsFormModel = aChangeDetailsFormModel()
                .withDirectorEmail("non valid email").build()

            const errors: ValidationResult = changeDetailsSchema(signatory).validate(form, { abortEarly: false })

            assert.isDefined(errors.error)
            assert.equal(errors.error!.details.length, 1)

            assert.equal(errors.error!.details[0].context!.key, `directorEmail`)
            assert.equal(errors.error!.details[0].type, `string.email`)
            assert.equal(errors.error!.details[0].message, `Enter an email address in the correct format, like name@example.com`)
        })
    })

    describe("Corporate Signatory", () => {

        it("should return no errors when data is valid", () => {

            const signatory: DissolutionGetDirector = aDissolutionGetDirector().withName("Mr Corporate Director Signatory").withOnBehalfName("Mr Old Accountant").build()
            const form: ChangeDetailsFormModel = aChangeDetailsFormModel()
                .withDirectorEmail(undefined)
                .withOnBehalfName("Mr New Accountant")
                .withOnBehalfEmail("new.accountant@mail.com").build()

            const errors: ValidationResult = changeDetailsSchema(signatory).validate(form, { abortEarly: false })

            assert.isUndefined(errors.error)
        })

        it("should return an error if mandatory text fields have not been provided", () => {
            const signatory: DissolutionGetDirector = aDissolutionGetDirector().withName("Mr Corporate Director Signatory").withOnBehalfName("Mr Old Accountant").build()
            const form: ChangeDetailsFormModel = aChangeDetailsFormModel()
                .withDirectorEmail(undefined)
                .withOnBehalfName("")
                .withOnBehalfEmail("").build()

            const errors: ValidationResult = changeDetailsSchema(signatory).validate(form, { abortEarly: false })

            assert.isDefined(errors.error)
            assert.equal(errors.error!.details.length, 2)

            assert.equal(errors.error!.details[0].context!.key, `onBehalfName`)
            assert.equal(errors.error!.details[0].type, `string.empty`)
            assert.equal(errors.error!.details[0].message, `Enter the name of the authorised person who will sign for Mr Corporate Director Signatory`)

            assert.equal(errors.error!.details[1].context!.key, `onBehalfEmail`)
            assert.equal(errors.error!.details[1].type, `string.empty`)
            assert.equal(errors.error!.details[1].message, `Enter the email address for the authorised person who will sign for Mr Corporate Director Signatory`)
        })

        it("should return an error if email field does not contain a valid email value", () => {

            const signatory: DissolutionGetDirector = aDissolutionGetDirector().withName("Mr Corporate Director Signatory").withOnBehalfName("Mr Old Accountant").build()
            const form: ChangeDetailsFormModel = aChangeDetailsFormModel()
                .withDirectorEmail(undefined)
                .withOnBehalfName("Mr Accountant")
                .withOnBehalfEmail("not an email").build()

            const errors: ValidationResult = changeDetailsSchema(signatory).validate(form, { abortEarly: false })

            assert.isDefined(errors.error)
            assert.equal(errors.error!.details.length, 1)

            assert.equal(errors.error!.details[0].context!.key, `onBehalfEmail`)
            assert.equal(errors.error!.details[0].type, `string.email`)
            assert.equal(errors.error!.details[0].message, `Enter an email address in the correct format, like name@example.com`)
        })

        it("should return an error if a name is provided that is above the maximum length", () => {

            const signatory: DissolutionGetDirector = aDissolutionGetDirector().withName("Mr Corporate Director Signatory").withOnBehalfName("Mr Old Accountant").build()
            const form: ChangeDetailsFormModel = aChangeDetailsFormModel()
                .withDirectorEmail(undefined)
                .withOnBehalfName("x".repeat(251))
                .withOnBehalfEmail("accountant@mail.com").build()

            const errors: ValidationResult = changeDetailsSchema(signatory).validate(form, { abortEarly: false })

            assert.isDefined(errors.error)
            assert.equal(errors.error!.details.length, 1)

            assert.equal(errors.error!.details[0].context!.key, `onBehalfName`)
            assert.equal(errors.error!.details[0].type, `string.max`)
            assert.equal(errors.error!.details[0].message, `Enter a name that is less than 250 characters for the authorised person who will sign for Mr Corporate Director Signatory`)
        })
    })
})
