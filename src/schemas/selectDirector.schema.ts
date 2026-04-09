import * as Joi from "@hapi/joi"

import OfficerType from "app/models/dto/officerType.enum"
import DirectorDetails from "app/models/view/directorDetails.model"
import {isCorporateOfficer} from "app/models/dto/officerRole.enum"

export default function selectDirectorSchema (officerType: OfficerType, directors?: DirectorDetails[]): Joi.ObjectSchema {

    const allowedIds: string[] = (directors || []).map(d => d.id)

    const directorField: Joi.StringSchema = Joi.string()
        .valid(...allowedIds, "other")
        .required()
        .messages({
            "any.required": `Select which of the ${officerType}s you are or if you're not a ${officerType}`,
            "string.empty": `Select which of the ${officerType}s you are or if you're not a ${officerType}`,
            "any.only": `Invalid ${officerType} specified`
        })

    let schema = Joi.object().keys({
        director: directorField,
        _csrf: Joi.string()
            .optional()
            .messages({
                "any.required": "There was a problem submitting your form"
            })
    })

    ;(directors || []).forEach(d => {
        if (isCorporateOfficer(d.officerRole)) {
            const fieldName = `onBehalfName_${d.id}`
            const fieldSchema = Joi.string()
                .when("director", {
                    is: d.id,
                    then: Joi.string()
                        .required()
                        .max(250)
                        .pattern(/\S/, { name: "non-whitespace" })
                        .messages({
                            "any.required": `Enter the name of the authorised person who will sign on behalf of the corporate ${officerType}`,
                            "string.empty": `Enter the name of the authorised person who will sign on behalf of the corporate ${officerType}`,
                            "string.max": `Name of authorised person signing must be 250 characters or less`,
                            "string.pattern.name": `Enter the name of the authorised person who will sign on behalf of the corporate ${officerType}`
                        }),
                    otherwise: Joi.string().allow("").optional()
                })

            schema = schema.keys({ [fieldName]: fieldSchema })
        }
    })

    return schema
}
