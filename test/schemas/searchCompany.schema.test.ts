import { ValidationResult } from '@hapi/joi'
import { assert } from 'chai'
import { generateSearchCompanyForm } from '../fixtures/companyProfile.fixtures'

import SearchCompanyFormModel from 'app/models/form/searchCompany.model'
import searchCompanySchema from 'app/schemas/searchCompany.schema'

describe('Search Company Schema', () => {
  it('should return no errors when data is valid', () => {
    const validForm: SearchCompanyFormModel = generateSearchCompanyForm('123')

    const errors: ValidationResult = searchCompanySchema.validate(validForm)

    assert.isUndefined(errors.error)
  })

  it('should return an error when company number is not provided', () => {
    const form: SearchCompanyFormModel = generateSearchCompanyForm()
    form.companyNumber = undefined

    const errors: ValidationResult = searchCompanySchema.validate(form)

    assert.isDefined(errors.error)
    assert.equal(errors.error!.details.length, 1)
    assert.equal(errors.error!.details[0].context!.key, 'companyNumber')
    assert.equal(errors.error!.details[0].type, `any.required`)
    assert.equal(errors.error!.details[0].message, 'You must enter a Company Number')
  })

  it('should return an error when an empty company number is not provided', () => {
    const form: SearchCompanyFormModel = generateSearchCompanyForm()
    form.companyNumber = ''

    const errors: ValidationResult = searchCompanySchema.validate(form)

    assert.isDefined(errors.error)
    assert.equal(errors.error!.details.length, 1)
    assert.equal(errors.error!.details[0].context!.key, 'companyNumber')
    assert.equal(errors.error!.details[0].type, `string.empty`)
    assert.equal(errors.error!.details[0].message, 'You must enter a Company Number')
  })

  it('should return an error when an company number > 8 characters is provided', () => {
    const form: SearchCompanyFormModel = generateSearchCompanyForm('123456789')

    const errors: ValidationResult = searchCompanySchema.validate(form)

    assert.isDefined(errors.error)
    assert.equal(errors.error!.details.length, 1)
    assert.equal(errors.error!.details[0].context!.key, 'companyNumber')
    assert.equal(errors.error!.details[0].type, `string.max`)
    assert.equal(errors.error!.details[0].message, 'Company number does not exist or is incorrect')
  })
})
