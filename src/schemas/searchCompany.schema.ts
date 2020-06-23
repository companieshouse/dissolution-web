import * as Joi from '@hapi/joi'

const formSchema = Joi.object({
  companyNumber: Joi.string()
    .required()
    .max(8)
    .messages({
      'string.empty': 'You must enter a valid Company Number',
      'string.max': 'You must enter a valid Company Number',
      'any.required': 'You must enter a valid Company Number'
    })
})

export default formSchema