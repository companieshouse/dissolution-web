import * as Joi from '@hapi/joi'

const formSchema = Joi.object({
  companyNumberField: Joi.string()
    .required()
    .min(8)
    .max(8)
    .messages({
      'any.required': 'You must enter a valid Company Number'
    })
})

export default formSchema