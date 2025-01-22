import * as Joi from "@hapi/joi"

const formSchema = Joi.object({
    confirmation: Joi.string()
        .required()
        .messages({
            "any.required": "Select to confirm that you have read and understood the statements."
        }),
    _csrf: Joi.string()
        .optional()
        .messages({
            "any.required": "There was a problem submitting your form"
        })
})

export default formSchema
