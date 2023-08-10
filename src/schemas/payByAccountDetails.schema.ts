import * as Joi from "@hapi/joi"

const emptyPresenterIdError: string = "You must enter a Presenter ID"
const emptyPresenterAuthCodeError: string = "You must enter a Presenter authentication code"

const payByAccountDetailsSchema = Joi.object({
    presenterId: Joi.string()
        .required()
        .messages({
            "string.empty": emptyPresenterIdError,
            "any.required": emptyPresenterIdError
        }),
    presenterAuthCode: Joi.string()
        .required()
        .messages({
            "string.empty": emptyPresenterAuthCodeError,
            "any.required": emptyPresenterAuthCodeError
        })
})

export default payByAccountDetailsSchema
