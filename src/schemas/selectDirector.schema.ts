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

    ;(directors || [])
        .filter(d => isCorporateOfficer(d.officerRole))
        .forEach(d => {
            const fieldName = `onBehalfName_${d.id}`
            const fieldSchema = Joi.string()
                .when("director", {
                    is: d.id,
                    then: onBehalfNameValidationSchema(),
                    otherwise: Joi.string().allow("").optional()
                })

            schema = schema.keys({[fieldName]: fieldSchema})
        })

    return schema
}

function onBehalfNameValidationSchema() {
    return Joi.string()
        .required()
        .max(250)
        .pattern(/\S/, { name: "non-whitespace" })
        .messages({
            "any.required": `Enter your full name`,
            "string.empty": `Enter your full name`,
            "string.max": `Full name must be 250 characters or less`,
            "string.pattern.name": `Enter your full name`
        })
}
