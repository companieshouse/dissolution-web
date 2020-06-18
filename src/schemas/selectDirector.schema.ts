import * as Joi from '@hapi/joi'

const selectDirectorSchema = Joi.object({
  director: Joi.string()
    .required()
    .messages({
      'string.empty': `Select which of the directors you are or if you're not a director`
    })
})

export default selectDirectorSchema
