import Joi from "@hapi/joi"
import DissolutionApprovalModel from "app/models/form/dissolutionApproval.model"

export default function createEndorseCertificateSchema(approval?: DissolutionApprovalModel): Joi.ObjectSchema {
    const confirmationErrorMsg = approval?.isCorporateOfficer
        ? "Confirm that you are the named person and you are authorised to sign on the corporate director's behalf"
        : "Confirm that you are the named director of this company"

    return Joi.object({
        confirmation: Joi.string()
            .required()
            .messages({
                "any.required": confirmationErrorMsg
            }),
        declaration: Joi.string()
            .required()
            .messages({
                "any.required": "Confirm that you are making the declaration"
            }),
        _csrf: Joi.string()
            .optional()
            .messages({
                "any.required": "There was a problem submitting your form"
            })
    })
}
