import * as Joi from "@hapi/joi"

const emptyCompanyNumberError: string = "You must enter a Company Number"
const formSchema = Joi.object({
    companyNumber: Joi.string()
        .required()
        .max(8)
        .messages({
            "string.empty": emptyCompanyNumberError,
            "string.max": "Company number does not exist or is incorrect",
            "any.required": emptyCompanyNumberError
        }),
    _csrf: Joi.string()
        .optional()
        .messages({
            "any.required": "There was a problem submitting your form"
        })
})

export default formSchema
