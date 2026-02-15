import * as Joi from "@hapi/joi"
import { generateSchemaForSignatoryDetails } from "./signatoryDetails.schema"

import OfficerType from "app/models/dto/officerType.enum"
import { DirectorToSign } from "app/models/session/directorToSign.model"
import { isCorporateOfficer } from "app/models/dto/officerRole.enum"

export default function defineSignatoryInfoSchema (signatories: DirectorToSign[], officerType: OfficerType): Joi.ObjectSchema {
    return Joi.object(generateSchemaForSignatories(signatories, officerType))
}

function generateSchemaForSignatories (signatories: DirectorToSign[], officerType: OfficerType): Joi.SchemaMap {
    return signatories.reduce((schema: Joi.SchemaMap, isCorporateOfficer: DirectorToSign) => ({
        ...schema,
        ...generateSchemaForSignatory(isCorporateOfficer, officerType)
    }), {})
}

function generateSchemaForSignatory (signatory: DirectorToSign, officerType: OfficerType): Joi.SchemaMap {
    const formSuffix: string = `_${formatSignatoryId(signatory)}`

    return {
        ...generateSchemaForSignatoryDetails(isCorporateOfficer(signatory.officerRole), officerType, formSuffix),
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
