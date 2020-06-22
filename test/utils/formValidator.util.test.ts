import 'reflect-metadata'

import Joi from '@hapi/joi'
import { assert } from 'chai'

import Optional from 'app/models/optional'
import ValidationErrors from 'app/models/view/validationErrors.model'
import FormValidator from 'app/utils/formValidator.util'

describe('FormValidator', () => {

  const validator: FormValidator = new FormValidator()

  const textFieldEmptyMsg = 'You must enter a value for text'
  const textFieldMinMsg = 'You must enter at least 3 characters'

  const emailFieldEmptyMsg = 'You must enter a value for email'
  const emailFieldEmailMsg = 'You must enter a valid email address'
  const mockSchema = Joi.object({
    someTextField: Joi.string()
      .required()
      .min(3)
      .messages({
        'string.empty': textFieldEmptyMsg,
        'string.min': textFieldMinMsg
      }),
    someEmailField: Joi.string()
      .required()
      .email()
      .messages({
        'string.empty': emailFieldEmptyMsg,
        'string.email': emailFieldEmailMsg
      })
  })

  describe('validate', () => {
    it('should return null if validation returns no errors', () => {
      const validData = {
        someTextField: 'exampleText',
        someEmailField: 'example@mail.com'
      }
      const result: Optional<ValidationErrors> = validator.validate(validData, mockSchema)

      assert.isNull(result)
    })

    it('should return error for each field violating schema rules', () => {
      const invalidData = {
        someTextField: '!?',
        someEmailField: 'invalidEmail'
      }
      const result: Optional<ValidationErrors> = validator.validate(invalidData, mockSchema)

      assert.equal(result!.someTextField, textFieldMinMsg)
      assert.equal(result!.someEmailField, emailFieldEmailMsg)
    })

    it('should return error for each empty field', () => {
      const invalidData = {
        someTextField: '',
        someEmailField: ''
      }
      const result: Optional<ValidationErrors> = validator.validate(invalidData, mockSchema)

      assert.equal(result!.someTextField, textFieldEmptyMsg)
      assert.equal(result!.someEmailField, emailFieldEmptyMsg)
    })
  })
})
