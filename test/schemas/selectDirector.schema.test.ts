import { ValidationResult } from '@hapi/joi'
import { assert } from 'chai'
import { generateSelectDirectorFormModel } from '../fixtures/companyOfficers.fixtures'

import SelectDirectorFormModel from 'app/models/selectDirector.model'
import selectDirectorSchema from 'app/schemas/selectDirector.schema'

describe('Select Director Schema', () => {

  it('should return no errors when data is valid', () => {
    const validForm: SelectDirectorFormModel = generateSelectDirectorFormModel('123')

    const errors: ValidationResult = selectDirectorSchema.validate(validForm)

    assert.isUndefined(errors.error)
  })

  it('should return an error when director is not provided', () => {
    const form: SelectDirectorFormModel = generateSelectDirectorFormModel()
    form.director = undefined

    const errors: ValidationResult = selectDirectorSchema.validate(form)

    assert.isDefined(errors.error)
    assert.equal(errors.error!.details.length, 1)
    assert.equal(errors.error!.details[0].context!.key, 'director')
    assert.equal(errors.error!.details[0].type, `any.required`)
    assert.equal(errors.error!.details[0].message, `Select which of the directors you are or if you're not a director`)
  })

  it('should return an error when an empty director is not provided', () => {
    const form: SelectDirectorFormModel = generateSelectDirectorFormModel()
    form.director = ''

    const errors: ValidationResult = selectDirectorSchema.validate(form)

    assert.isDefined(errors.error)
    assert.equal(errors.error!.details.length, 1)
    assert.equal(errors.error!.details[0].context!.key, 'director')
    assert.equal(errors.error!.details[0].type, `string.empty`)
    assert.equal(errors.error!.details[0].message, `Select which of the directors you are or if you're not a director`)
  })
})
