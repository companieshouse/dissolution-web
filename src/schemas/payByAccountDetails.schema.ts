import * as Joi from "@hapi/joi"

const emptyPresenterIdError: string = "Enter your presenter ID"
const invalidPresenterIdError: string = "Presenter ID must only include numbers"
const invalidLengthPresenterIdError: string = "Presenter ID must be 11 numbers"
const emptyPresenterAuthCodeError: string = "Enter your presenter authentication code"
const invalidPresenterAuthCodeError: string = "Presenter authentication code must only include letters a to z, and numbers"
const invalidLengthPresenterAuthCodeError: string = "Presenter authentication code must be 11 characters"

const payByAccountDetailsSchema = Joi.object({
    presenterId: Joi.string()
        .required()
        .pattern(/^\d+$/)
        .length(11)
        .messages({
            "string.empty": emptyPresenterIdError,
            "string.length": invalidLengthPresenterIdError,
            "string.pattern.base": invalidPresenterIdError,
            "any.required": emptyPresenterIdError
        }),
    presenterAuthCode: Joi.string()
        .required()
        .alphanum()
        .length(11)
        .messages({
            "string.empty": emptyPresenterAuthCodeError,
            "string.alphanum": invalidPresenterAuthCodeError,
            "string.length": invalidLengthPresenterAuthCodeError,
            "any.required": emptyPresenterAuthCodeError
        }),
    _csrf: Joi.string()
        .optional()
        .messages({
            "any.required": "There was a problem submitting your form"
        })
})

export default payByAccountDetailsSchema
