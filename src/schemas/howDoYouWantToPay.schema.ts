import * as Joi from "@hapi/joi"

import PaymentType from "app/models/dto/paymentType.enum"

export const ERROR_MESSAGE = "Select how the payment will be made"

export const howDoYouWantToPaySchema: Joi.ObjectSchema = Joi.object({
    paymentType: Joi.string()
        .required()
        .valid(PaymentType.ACCOUNT, PaymentType.CREDIT_DEBIT_CARD)
        .messages({
            "any.required": ERROR_MESSAGE,
            "any.only": ERROR_MESSAGE,
            "string.empty": ERROR_MESSAGE
        }),
    _csrf: Joi.string()
        .optional()
        .messages({
            "any.required": "There was a problem submitting your form"
        })
})
