import * as Joi from "@hapi/joi"

const formSchema = Joi.object({
    // Error message for confirmation is set dynamically in the controller
    confirmation: Joi.string()
        .required(),
    declaration: Joi.string()
        .required()
        .messages({
            "any.required": "Confirm that you are making the declaration"
        }),
    _csrf: Joi.string()
        .optional()
        .messages({
            "any.required": "There was a problem submitting your form"
        })
})

export default formSchema
