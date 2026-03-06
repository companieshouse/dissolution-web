import "reflect-metadata"

import Joi from "@hapi/joi"
import { assert } from "chai"

import Optional from "app/models/optional"
import ValidationErrors, { ValidationError} from "app/models/view/validationErrors.model"
import FormValidator from "app/utils/formValidator.util"
import RichFormValidator from "app/utils/richFormValidator.util"

describe("RichFormValidator", () => {

    const validator: FormValidator = new RichFormValidator()

    const textFieldEmptyMsg = "You must enter a value for text"
    const textFieldMinMsg = "Min 2 characters"
    const textFieldMaxMsg = "Max 15 characters"

    const emailFieldEmptyMsg = "You must enter a value for email"
    const emailFieldEmailMsg = "You must enter a valid email address"
    const mockSchema = Joi.object({
        someTextField: Joi.string()
            .required()
            .min(2)
            .max(15)
            .messages({
                "string.empty": textFieldEmptyMsg,
                "string.min": textFieldMinMsg,
                "string.max": textFieldMaxMsg
            }),
        someEmailField: Joi.string()
            .required()
            .email()
            .messages({
                "string.empty": emailFieldEmptyMsg,
                "string.email": emailFieldEmailMsg
            })
    })

    describe("validate", () => {
        it("should return null if validation returns no errors", () => {
            const validData = {
                someTextField: "exampleText",
                someEmailField: "example@mail.com"
            }
            const result: Optional<ValidationErrors> = validator.validate(validData, mockSchema)

            assert.isNull(result)
        })

        it("should return error for each field violating schema rules", () => {
            const invalidData = {
                someTextField: "xxxxxxxxxxxxxxxxxx",
                someEmailField: "invalidEmail"
            }
            const result: Optional<ValidationErrors> = validator.validate(invalidData, mockSchema)

            const someTextFieldError = result!.someTextField as ValidationError
            const someEmailFieldError = result!.someEmailField as ValidationError

            assert.equal(someTextFieldError.message, textFieldMaxMsg)
            assert.equal(someTextFieldError.alt_message, "too-long")
            assert.equal(someEmailFieldError.message, emailFieldEmailMsg)
            assert.equal(someEmailFieldError.alt_message, "invalid-email")
        })

        it("should default alt message if no message defined for type", () => {
            const invalidData = {
                someTextField: "x",
            }
            const result: Optional<ValidationErrors> = validator.validate(invalidData, mockSchema)

            const someTextFieldError = result!.someTextField as ValidationError

            assert.equal(someTextFieldError.message, textFieldMinMsg)
            assert.equal(someTextFieldError.alt_message, "string.min")
        })

        it("should return error for each empty field", () => {
            const invalidData = {
                someTextField: "",
                someEmailField: ""
            }
            const result: Optional<ValidationErrors> = validator.validate(invalidData, mockSchema)

            const someTextFieldError = result!.someTextField as ValidationError
            const someEmailFieldError = result!.someEmailField as ValidationError

            assert.equal(someTextFieldError.message, textFieldEmptyMsg)
            assert.equal(someTextFieldError.alt_message, "empty")
            assert.equal(someEmailFieldError.message, emailFieldEmptyMsg)
            assert.equal(someEmailFieldError.alt_message, "empty")
        })
    })
})
