import * as Joi from "@hapi/joi"
import { generateSchemaForCorporateSignatoryDetails, generateSchemaForIndividualSignatoryDetails } from "./signatoryDetails.schema"
import DissolutionGetDirector, { isCorporateOfficer } from "app/models/dto/dissolutionGetDirector"

export default function defineSignatoryInfoSchema (signatory: DissolutionGetDirector): Joi.ObjectSchema {
    const signatoryName: string = signatory.name
    const schema = isCorporateOfficer(signatory)
        ? generateSchemaForCorporateSignatoryDetails(signatoryName)
        : generateSchemaForIndividualSignatoryDetails(signatoryName)
    return Joi.object({
        ...schema,
        _csrf: Joi.string()
            .optional()
            .messages({
                "any.required": "There was a problem submitting your form"
            })
    })
}
