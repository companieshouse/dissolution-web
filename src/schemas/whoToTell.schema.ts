import * as Joi from "@hapi/joi"

const formSchema = Joi.object({
    confirmation: Joi.string()
        .required()
        .messages({
            "any.required": "Confirm that the directors or members understand that they are responsible for notifying all interested parties"
        }),
    _csrf: Joi.string()
        .optional()
        .messages({
            "any.required": "There was a problem submitting your form"
        })
})

export default formSchema
