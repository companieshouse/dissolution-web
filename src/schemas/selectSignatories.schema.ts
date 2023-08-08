import * as Joi from "@hapi/joi";

import OfficerType from "app/models/dto/officerType.enum";

export default function selectSignatoriesSchema (officerType: OfficerType, minSignatories: number): Joi.ObjectSchema {
    return Joi.object({
        signatories: Joi
            .array()
            .required()
            .min(minSignatories)
            .items(Joi.string().required())
            .messages({
                "any.required": `Select the ${officerType}s who will be signing the application.`,
                "array.min": `Select more than half of the ${officerType}s to sign the application.`
            })
    });
}
