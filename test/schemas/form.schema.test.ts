import { ValidationResult } from '@hapi/joi'
import { assert } from 'chai'

import { FormFormModel } from 'app/models/form/form.model'
import formSchema from 'app/schemas/form.schema'

describe('Form Schema', () => {

  it('should return no errors when data is valid', () => {
    const validForm: FormFormModel = {
      someTextField: 'validText',
      someEmailField: 'validEmail@example.com',
      companyNumber: '12345'
    } as FormFormModel

    const errors: ValidationResult = formSchema.validate(validForm)

    assert.isUndefined(errors.error)
  })

  it('should return errors when data is present but invalid', () => {
    const validForm: FormFormModel = {
      someTextField: '',
      someEmailField: 'invalidEmail.com'
    } as FormFormModel

    const errors: ValidationResult = formSchema.validate(validForm)

    assert.isDefined(errors.error)
  })

  it('should return errors when data has missing properties', () => {
    const validForm: FormFormModel = {
      someEmailField: 'invalidEmail.com'
    } as FormFormModel

    const errors: ValidationResult = formSchema.validate(validForm)

    assert.isDefined(errors.error)
  })
})
