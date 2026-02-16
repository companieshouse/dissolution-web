import * as Joi from "@hapi/joi"
import { generateSchemaForSignatoryDetails } from "./signatoryDetails.schema"
import DissolutionGetDirector, { isCorporateOfficer } from "app/models/dto/dissolutionGetDirector"

export default function defineSignatoryInfoSchema (signatory: DissolutionGetDirector): Joi.ObjectSchema {

    const signatoryName: string = signatory.name

    return Joi.object({
        ...generateSchemaForSignatoryDetails(isCorporateOfficer(signatory), signatoryName),
        _csrf: Joi.string()
            .optional()
            .messages({
                "any.required": "There was a problem submitting your form"
            })
    })
}
