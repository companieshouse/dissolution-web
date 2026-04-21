import * as Joi from "@hapi/joi"

const companyNumberSchema = Joi.string()
    .required()
    .trim()
    .min(1)

export default companyNumberSchema

