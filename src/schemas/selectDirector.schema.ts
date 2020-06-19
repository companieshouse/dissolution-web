import * as Joi from '@hapi/joi'

const selectDirectorSchema: Joi.ObjectSchema = Joi.object({
  director: Joi.string()
    .required()
    .messages({
      'any.required': `Select which of the directors you are or if you're not a director`,
      'string.empty': `Select which of the directors you are or if you're not a director`
    })
})

export default selectDirectorSchema
