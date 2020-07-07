import * as Joi from '@hapi/joi'

export default function selectSignatoriesSchema(minSignatories: number): Joi.ObjectSchema {
  return Joi.object({
    signatories: Joi
      .array()
      .required()
      .min(minSignatories)
      .items(Joi.string().required())
      .messages({
        'any.required': 'Select the directors who will be signing the application.',
        'array.min': 'Select more than half of the directors to sign the application.'
      })
  })
}
