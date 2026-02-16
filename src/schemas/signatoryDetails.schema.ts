import * as Joi from "@hapi/joi"

export function generateSchemaForSignatoryDetails (
    isCorporateOfficer: boolean,
    signatoryName: string,
    formSuffix: string = ""
): Joi.SchemaMap {
    if (isCorporateOfficer) {
        return {
            [`directorEmail${formSuffix}`]: Joi.string().forbidden(),
            [`onBehalfName${formSuffix}`]: Joi.string().required().max(250).messages({
                "any.required": `Enter the name of the authorised person who will sign for ${signatoryName}`,
                "string.empty": `Enter the name of the authorised person who will sign for ${signatoryName}`,
                "string.max": `Enter a name that is less than 250 characters for the authorised person who will sign for ${signatoryName}`
            }),
            [`onBehalfEmail${formSuffix}`]: Joi.string().required().email().messages({
                "any.required": `Enter the email address for the authorised person who will sign for ${signatoryName}`,
                "string.empty": `Enter the email address for the authorised person who will sign for ${signatoryName}`,
                "string.email": `Enter an email address in the correct format, like name@example.com`
            })
        }
    } else {
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
}
