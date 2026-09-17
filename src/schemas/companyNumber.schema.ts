import * as Joi from "joi";

const companyNumberSchema = Joi.string().alphanum().trim().min(1).max(8).required();

export default companyNumberSchema;
