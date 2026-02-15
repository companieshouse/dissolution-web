import * as Joi from "@hapi/joi"
import OfficerType from "app/models/dto/officerType.enum"

export function generateSchemaForSignatoryDetails (isCorporateOfficer: boolean, officerType: OfficerType, formSuffix: string = ""): Joi.SchemaMap {
    if (isCorporateOfficer) {
        return {
            [`directorEmail${formSuffix}`]: Joi.string().forbidden(),
            [`onBehalfName${formSuffix}`]: Joi.string().required().max(250).messages({
                "any.required": `Enter the name for the person signing on behalf of the ${officerType}`,
                "string.empty": `Enter the name for the person signing on behalf of the ${officerType}`,
                "string.max": `Enter a name that is less than 250 characters for the person signing on behalf of the ${officerType}`
            }),
            [`onBehalfEmail${formSuffix}`]: Joi.string().required().email().messages({
                "any.required": `Enter the email address for the person signing on behalf of the ${officerType}`,
                "string.empty": `Enter the email address for the person signing on behalf of the ${officerType}`,
                "string.email": `Enter a valid email address for the person signing on behalf of the ${officerType}`
            })
        }
    } else {
        return {
            [`directorEmail${formSuffix}`]: Joi.string().email().required().messages({
                "any.required": `Enter the email address for the ${officerType}`,
                "string.empty": `Enter the email address for the ${officerType}`,
                "string.email": `Enter a valid email address for the ${officerType}`
            }),
            [`onBehalfName${formSuffix}`]: Joi.string().forbidden(),
            [`onBehalfEmail${formSuffix}`]: Joi.string().forbidden()
        }
    }
}
