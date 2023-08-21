import * as Joi from "@hapi/joi"

const formSchema = Joi.object({
    confirmation: Joi.string()
        .required()
        .messages({
            "any.required": "You must agree to continue"
        })
})

export default formSchema
