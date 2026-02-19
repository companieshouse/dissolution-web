import * as Joi from "@hapi/joi"
import { generateSchemaForCorporateSignatoryDetails, generateSchemaForIndividualSignatoryDetails } from "./signatoryDetails.schema"
import { DirectorToSign } from "app/models/session/directorToSign.model"
import { isCorporateOfficer } from "app/models/dto/officerRole.enum"

export default function defineSignatoryInfoSchema (signatories: DirectorToSign[]): Joi.ObjectSchema {
    return Joi.object(generateSchemaForSignatories(signatories))
}

function generateSchemaForSignatories (signatories: DirectorToSign[]): Joi.SchemaMap {
    return signatories.reduce((schema: Joi.SchemaMap, signatory: DirectorToSign) => ({
        ...schema,
        ...generateSchemaForSignatory(signatory)
    }), {})
}

function generateSchemaForSignatory (signatory: DirectorToSign): Joi.SchemaMap {
    const signatoryName: string = signatory.name
    const formSuffix: string = `_${formatSignatoryId(signatory)}`
    const schema = isCorporateOfficer(signatory.officerRole)
        ? generateSchemaForCorporateSignatoryDetails(signatoryName, formSuffix)
        : generateSchemaForIndividualSignatoryDetails(signatoryName, formSuffix)

    return {
        ...schema,
        _csrf: Joi.string()
            .optional()
            .messages({
                "any.required": "There was a problem submitting your form"
            })
    }
}

function formatSignatoryId (signatory: DirectorToSign): string {
    return signatory.id.toLowerCase()
}
