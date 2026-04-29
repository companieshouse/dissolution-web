import * as Joi from "@hapi/joi"

export default function resendEmailSchema (): Joi.ObjectSchema {
    return Joi.object().keys({
        signatoryId: Joi.string()
            .pattern(/^[A-Za-z0-9_-]{1,50}$/)
            .required()
            .messages({
                "string.pattern.base": `Invalid signatory specified`
            }),
        _csrf: Joi.string().optional()
    })
}

