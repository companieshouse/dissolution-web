import * as Joi from "@hapi/joi"

import OfficerType from "app/models/dto/officerType.enum"

export default function selectSignatoriesSchema (officerType: OfficerType, minSignatories: number): Joi.ObjectSchema {
    return Joi.object({
        signatories: Joi
            .array()
            .required()
            .min(minSignatories)
            .items(Joi.string().required())
            .messages({
                "any.required": `Select the ${officerType}s who will sign the application.`,
                "array.min": `Select ${minSignatories} or more ${officerType}s who will sign the application.`
            }),
        _csrf: Joi.string()
            .optional()
            .messages({
                "any.required": "There was a problem submitting your form"
            })
    })
}
