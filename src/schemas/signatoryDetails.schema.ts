import * as Joi from "@hapi/joi"

export function generateSchemaForCorporateSignatoryDetails (
    signatoryName: string,
    formSuffix: string = ""
): Joi.SchemaMap {
    return {
        [`directorEmail${formSuffix}`]: Joi.string().forbidden(),
        [`onBehalfName${formSuffix}`]: Joi.string().required().max(250).messages({
            "any.required": `Enter the name of the authorised person who will sign for ${signatoryName}`,
            "string.empty": `Enter the name of the authorised person who will sign for ${signatoryName}`,
            "string.max": `Name of authorised person signing for ${signatoryName} must be 250 characters or less`
        }),
        [`onBehalfEmail${formSuffix}`]: Joi.string().required().email().messages({
            "any.required": `Enter the email address for the authorised person who will sign for ${signatoryName}`,
            "string.empty": `Enter the email address for the authorised person who will sign for ${signatoryName}`,
            "string.email": `Enter an email address in the correct format, like name@example.com`
        })
    }
}

export function generateSchemaForIndividualSignatoryDetails (
    signatoryName: string,
    formSuffix: string = ""
): Joi.SchemaMap {
    return {
        [`directorEmail${formSuffix}`]: Joi.string().email().required().messages({
            "any.required": `Enter the email address for ${signatoryName}`,
            "string.empty": `Enter the email address for ${signatoryName}`,
            "string.email": `Enter an email address in the correct format, like name@example.com`
        }),
        [`onBehalfName${formSuffix}`]: Joi.string().forbidden(),
        [`onBehalfEmail${formSuffix}`]: Joi.string().forbidden()
    }
}
