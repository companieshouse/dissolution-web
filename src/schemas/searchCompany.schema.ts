import * as Joi from '@hapi/joi'

const errorMessage = 'Company number does not exist or is incorrect'
const formSchema = Joi.object({
  companyNumber: Joi.string()
    .required()
    .max(8)
    .messages({
      'string.empty': 'You must enter a Company Number',
      'string.max': errorMessage,
      'any.required': errorMessage
    })
})

export default formSchema