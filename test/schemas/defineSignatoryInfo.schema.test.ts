import { ValidationResult } from '@hapi/joi'
import { assert } from 'chai'
import { generateDefineSignatoryInfoFormModel } from '../fixtures/companyOfficers.fixtures'
import { generateDirectorToSign } from '../fixtures/session.fixtures'

import { DefineSignatoryInfoFormModel, SignatorySigning } from 'app/models/form/defineSignatoryInfo.model'
import DirectorToSign from 'app/models/session/directorToSign.model'
import defineSignatoryInfoSchema from 'app/schemas/defineSignatoryInfo.schema'

describe('Define Signatory Info Schema', () => {

  const SIGNATORY_1_ID = '123'
  const SIGNATORY_2_ID = '456'

  let signatory1: DirectorToSign
  let signatory2: DirectorToSign

  beforeEach(() => {
    signatory1 = generateDirectorToSign()
    signatory1.id = SIGNATORY_1_ID

    signatory2 = generateDirectorToSign()
    signatory2.id = SIGNATORY_2_ID
  })

  it('should return no errors when data is valid', () => {
    const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

    form[`isSigning_${SIGNATORY_1_ID}`] = SignatorySigning.WILL_SIGN
    form[`directorEmail_${SIGNATORY_1_ID}`] = 'director@mail.com'
    form[`onBehalfName_${SIGNATORY_1_ID}`] = ''
    form[`onBehalfEmail_${SIGNATORY_1_ID}`] = ''

    form[`isSigning_${SIGNATORY_2_ID}`] = SignatorySigning.ON_BEHALF
    form[`directorEmail_${SIGNATORY_2_ID}`] = ''
    form[`onBehalfName_${SIGNATORY_2_ID}`] = 'Mr Accountant'
    form[`onBehalfEmail_${SIGNATORY_2_ID}`] = 'accountant@mail.com'

    const errors: ValidationResult = defineSignatoryInfoSchema([signatory1, signatory2]).validate(form, { abortEarly: false })

    assert.isUndefined(errors.error)
  })

  it('should return an error when it has not been provided how a signatory will be signing', () => {
    const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

    form[`isSigning_${SIGNATORY_1_ID}`] = ''
    form[`directorEmail_${SIGNATORY_1_ID}`] = 'director@mail.com'
    form[`onBehalfName_${SIGNATORY_1_ID}`] = ''
    form[`onBehalfEmail_${SIGNATORY_1_ID}`] = ''

    form[`isSigning_${SIGNATORY_2_ID}`] = SignatorySigning.ON_BEHALF
    form[`directorEmail_${SIGNATORY_2_ID}`] = ''
    form[`onBehalfName_${SIGNATORY_2_ID}`] = 'Mr Accountant'
    form[`onBehalfEmail_${SIGNATORY_2_ID}`] = 'accountant@mail.com'

    const errors: ValidationResult = defineSignatoryInfoSchema([signatory1, signatory2]).validate(form, { abortEarly: false })

    assert.isDefined(errors.error)
    assert.equal(errors.error!.details.length, 2)

    assert.equal(errors.error!.details[0].context!.key, `isSigning_${SIGNATORY_1_ID}`)
    assert.equal(errors.error!.details[0].type, `any.only`)
    assert.equal(errors.error!.details[0].message, 'Select how the director will be signing the application')

    assert.equal(errors.error!.details[1].context!.key, `isSigning_${SIGNATORY_1_ID}`)
    assert.equal(errors.error!.details[1].type, `string.empty`)
    assert.equal(errors.error!.details[1].message, 'Select how the director will be signing the application')
  })

  it('should return an error if mandatory text fields have not been provided', () => {
    const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

    form[`isSigning_${SIGNATORY_1_ID}`] = SignatorySigning.WILL_SIGN
    form[`directorEmail_${SIGNATORY_1_ID}`] = ''
    form[`onBehalfName_${SIGNATORY_1_ID}`] = ''
    form[`onBehalfEmail_${SIGNATORY_1_ID}`] = ''

    form[`isSigning_${SIGNATORY_2_ID}`] = SignatorySigning.ON_BEHALF
    form[`directorEmail_${SIGNATORY_2_ID}`] = ''
    form[`onBehalfName_${SIGNATORY_2_ID}`] = ''
    form[`onBehalfEmail_${SIGNATORY_2_ID}`] = ''

    const errors: ValidationResult = defineSignatoryInfoSchema([signatory1, signatory2]).validate(form, { abortEarly: false })

    assert.isDefined(errors.error)
    assert.equal(errors.error!.details.length, 3)

    assert.equal(errors.error!.details[0].context!.key, `directorEmail_${SIGNATORY_1_ID}`)
    assert.equal(errors.error!.details[0].type, `string.empty`)
    assert.equal(errors.error!.details[0].message, 'Enter contact details for the directors')

    assert.equal(errors.error!.details[1].context!.key, `onBehalfName_${SIGNATORY_2_ID}`)
    assert.equal(errors.error!.details[1].type, `string.empty`)
    assert.equal(errors.error!.details[1].message, 'Enter contact details for the directors')

    assert.equal(errors.error!.details[2].context!.key, `onBehalfEmail_${SIGNATORY_2_ID}`)
    assert.equal(errors.error!.details[2].type, `string.empty`)
    assert.equal(errors.error!.details[2].message, 'Enter contact details for the directors')
  })

  it('should return an error if email fields do not contain valid email values', () => {
    const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

    form[`isSigning_${SIGNATORY_1_ID}`] = SignatorySigning.WILL_SIGN
    form[`directorEmail_${SIGNATORY_1_ID}`] = 'not an email'
    form[`onBehalfName_${SIGNATORY_1_ID}`] = ''
    form[`onBehalfEmail_${SIGNATORY_1_ID}`] = ''

    form[`isSigning_${SIGNATORY_2_ID}`] = SignatorySigning.ON_BEHALF
    form[`directorEmail_${SIGNATORY_2_ID}`] = ''
    form[`onBehalfName_${SIGNATORY_2_ID}`] = 'Mr Accountant'
    form[`onBehalfEmail_${SIGNATORY_2_ID}`] = 'also not an email'

    const errors: ValidationResult = defineSignatoryInfoSchema([signatory1, signatory2]).validate(form, { abortEarly: false })

    assert.isDefined(errors.error)
    assert.equal(errors.error!.details.length, 2)

    assert.equal(errors.error!.details[0].context!.key, `directorEmail_${SIGNATORY_1_ID}`)
    assert.equal(errors.error!.details[0].type, `string.email`)
    assert.equal(errors.error!.details[0].message, 'Enter contact details for the directors')

    assert.equal(errors.error!.details[1].context!.key, `onBehalfEmail_${SIGNATORY_2_ID}`)
    assert.equal(errors.error!.details[1].type, `string.email`)
    assert.equal(errors.error!.details[1].message, 'Enter contact details for the directors')
  })

  it('should return an error if a name is provided that is above the maximum length', () => {
    const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

    form[`isSigning_${SIGNATORY_1_ID}`] = SignatorySigning.WILL_SIGN
    form[`directorEmail_${SIGNATORY_1_ID}`] = 'director@mail.com'
    form[`onBehalfName_${SIGNATORY_1_ID}`] = ''
    form[`onBehalfEmail_${SIGNATORY_1_ID}`] = ''

    form[`isSigning_${SIGNATORY_2_ID}`] = SignatorySigning.ON_BEHALF
    form[`directorEmail_${SIGNATORY_2_ID}`] = ''
    form[`onBehalfName_${SIGNATORY_2_ID}`] = 'X'.repeat(251)
    form[`onBehalfEmail_${SIGNATORY_2_ID}`] = 'accountant@mail.com'

    const errors: ValidationResult = defineSignatoryInfoSchema([signatory1, signatory2]).validate(form, { abortEarly: false })

    assert.isDefined(errors.error)
    assert.equal(errors.error!.details.length, 1)

    assert.equal(errors.error!.details[0].context!.key, `onBehalfName_${SIGNATORY_2_ID}`)
    assert.equal(errors.error!.details[0].type, `string.max`)
    assert.equal(errors.error!.details[0].message, 'Enter contact details for the directors')
  })

  it('should ignore invalid fields if the associated radio option has not been selected', () => {
    const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

    form[`isSigning_${SIGNATORY_1_ID}`] = SignatorySigning.WILL_SIGN
    form[`directorEmail_${SIGNATORY_1_ID}`] = 'director@mail.com'
    form[`onBehalfName_${SIGNATORY_1_ID}`] = 'X'.repeat(500)
    form[`onBehalfEmail_${SIGNATORY_1_ID}`] = 'not an email'

    form[`isSigning_${SIGNATORY_2_ID}`] = SignatorySigning.ON_BEHALF
    form[`directorEmail_${SIGNATORY_2_ID}`] = 'also not an email'
    form[`onBehalfName_${SIGNATORY_2_ID}`] = 'Mr Accountant'
    form[`onBehalfEmail_${SIGNATORY_2_ID}`] = 'accountant@mail.com'

    const errors: ValidationResult = defineSignatoryInfoSchema([signatory1, signatory2]).validate(form, { abortEarly: false })

    assert.isUndefined(errors.error)
  })
})
