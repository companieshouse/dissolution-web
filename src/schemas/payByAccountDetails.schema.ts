import * as Joi from '@hapi/joi'

const emptyPresenterIdError: string = 'Presenter ID is required'
const emptyPresenterAuthCodeError: string = 'Presenter authentication code is required'

const payByAccountDetailsSchema = Joi.object({
  presenterId: Joi.string()
    .required()
    .messages({
      'string.empty': emptyPresenterIdError,
      'any.required': emptyPresenterIdError
    }),
  presenterAuthCode: Joi.string()
    .required()
    .messages({
      'string.empty': emptyPresenterAuthCodeError,
      'any.required': emptyPresenterAuthCodeError
    }),
})

export default payByAccountDetailsSchema
