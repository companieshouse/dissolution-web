import * as Joi from '@hapi/joi'

const formSchema = Joi.object({
  someTextField: Joi.string()
    .required()
    .min(3)
    .messages({
      'string.empty': 'You must enter a value for text',
      'string.min': 'You must enter at least 3 characters'
    }),
  someEmailField: Joi.string()
    .required()
    .email()
    .messages({
      'string.empty': 'You must enter a value for email',
      'string.email': 'You must enter a valid email address'
    }),
  companyNumber: Joi.string()
})

export default formSchema
