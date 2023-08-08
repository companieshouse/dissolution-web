import * as Joi from "@hapi/joi";

import OfficerType from "app/models/dto/officerType.enum";

export default function selectDirectorSchema (officerType: OfficerType): Joi.ObjectSchema {

    return Joi.object({
        director: Joi.string()
            .required()
            .messages({
                "any.required": `Select which of the ${officerType}s you are or if you're not a ${officerType}`,
                "string.empty": `Select which of the ${officerType}s you are or if you're not a ${officerType}`
            })
    });
}
