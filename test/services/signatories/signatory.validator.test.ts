import { assert } from 'chai'
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito'
import { generateDefineSignatoryInfoFormModel } from '../../fixtures/companyOfficers.fixtures'
import { generateValidationError } from '../../fixtures/error.fixtures'
import { generateDirectorToSign } from '../../fixtures/session.fixtures'

import { DefineSignatoryInfoFormModel, SignatorySigning } from 'app/models/form/defineSignatoryInfo.model'
import Optional from 'app/models/optional'
import DirectorToSign from 'app/models/session/directorToSign.model'
import ValidationErrors from 'app/models/view/validationErrors.model'
import SignatoryValidator from 'app/services/signatories/signatory.validator'
import FormValidator from 'app/utils/formValidator.util'

describe('SignatoryValidator', () => {

  let service: SignatoryValidator

  let formValidator: FormValidator

  beforeEach(() => {
    formValidator = mock(FormValidator)

    service = new SignatoryValidator(instance(formValidator))
  })

  describe('validateSignatoryInfo', () => {
    const SIGNATORY_1_ID = '123AbC'
    const SIGNATORY_2_ID = '456dEf'

    const SIGNATORY_1_ID_LOWER = SIGNATORY_1_ID.toLowerCase()
    const SIGNATORY_2_ID_LOWER = SIGNATORY_2_ID.toLowerCase()

    const SIGNATORY_1_NAME = 'Signatory 1'
    const SIGNATORY_2_NAME = 'Signatory 2'

    let signatory1: DirectorToSign
    let signatory2: DirectorToSign

    beforeEach(() => {
      signatory1 = generateDirectorToSign()
      signatory1.id = SIGNATORY_1_ID
      signatory1.name = SIGNATORY_1_NAME

      signatory2 = generateDirectorToSign()
      signatory2.id = SIGNATORY_2_ID
      signatory2.name = SIGNATORY_2_NAME
    })

    it('should return validation errors if schema validation fails', () => {
      const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

      const error: ValidationErrors = generateValidationError('signatory', 'some signatory info error')

      when(formValidator.validate(deepEqual(form), anything())).thenReturn(error)

      const result: Optional<ValidationErrors> = service.validateSignatoryInfo([signatory1, signatory2], form)

      assert.equal(result, error)

      verify(formValidator.validate(deepEqual(form), anything())).once()
    })

    it('should return validation errors if duplicate emails have been provided for signatories who will sign', () => {
      const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

      form[`isSigning_${SIGNATORY_1_ID_LOWER}`] = SignatorySigning.WILL_SIGN
      form[`directorEmail_${SIGNATORY_1_ID_LOWER}`] = 'director@mail.com'
      form[`onBehalfName_${SIGNATORY_1_ID_LOWER}`] = ''
      form[`onBehalfEmail_${SIGNATORY_1_ID_LOWER}`] = ''

      form[`isSigning_${SIGNATORY_2_ID_LOWER}`] = SignatorySigning.WILL_SIGN
      form[`directorEmail_${SIGNATORY_2_ID_LOWER}`] = 'director@mail.com'
      form[`onBehalfName_${SIGNATORY_2_ID_LOWER}`] = ''
      form[`onBehalfEmail_${SIGNATORY_2_ID_LOWER}`] = ''

      when(formValidator.validate(deepEqual(form), anything())).thenReturn(null)

      const result: Optional<ValidationErrors> = service.validateSignatoryInfo([signatory1, signatory2], form)

      assert.equal(Object.keys(result!).length, 2)
      assert.equal(result![`directorEmail_${SIGNATORY_1_ID_LOWER}`], `Enter a unique email address for ${SIGNATORY_1_NAME}`)
      assert.equal(result![`directorEmail_${SIGNATORY_2_ID_LOWER}`], `Enter a unique email address for ${SIGNATORY_2_NAME}`)
    })

    it('should return validation errors if duplicate emails have been provided for signatories who will be signed on behalf', () => {
      const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

      form[`isSigning_${SIGNATORY_1_ID_LOWER}`] = SignatorySigning.ON_BEHALF
      form[`directorEmail_${SIGNATORY_1_ID_LOWER}`] = ''
      form[`onBehalfName_${SIGNATORY_1_ID_LOWER}`] = 'Mr Accountant'
      form[`onBehalfEmail_${SIGNATORY_1_ID_LOWER}`] = 'accountant@mail.com'

      form[`isSigning_${SIGNATORY_2_ID_LOWER}`] = SignatorySigning.ON_BEHALF
      form[`directorEmail_${SIGNATORY_2_ID_LOWER}`] = ''
      form[`onBehalfName_${SIGNATORY_2_ID_LOWER}`] = 'Another Accountant'
      form[`onBehalfEmail_${SIGNATORY_2_ID_LOWER}`] = 'accountant@mail.com'

      when(formValidator.validate(deepEqual(form), anything())).thenReturn(null)

      const result: Optional<ValidationErrors> = service.validateSignatoryInfo([signatory1, signatory2], form)

      assert.equal(Object.keys(result!).length, 2)
      assert.equal(result![`onBehalfEmail_${SIGNATORY_1_ID_LOWER}`], `Enter a unique email address for ${SIGNATORY_1_NAME}`)
      assert.equal(result![`onBehalfEmail_${SIGNATORY_2_ID_LOWER}`], `Enter a unique email address for ${SIGNATORY_2_NAME}`)
    })

    it('should return validation errors if duplicate emails have been provided for alternative signing options', () => {
      const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

      form[`isSigning_${SIGNATORY_1_ID_LOWER}`] = SignatorySigning.WILL_SIGN
      form[`directorEmail_${SIGNATORY_1_ID_LOWER}`] = 'mixed@mail.com'
      form[`onBehalfName_${SIGNATORY_1_ID_LOWER}`] = ''
      form[`onBehalfEmail_${SIGNATORY_1_ID_LOWER}`] = ''

      form[`isSigning_${SIGNATORY_2_ID_LOWER}`] = SignatorySigning.ON_BEHALF
      form[`directorEmail_${SIGNATORY_2_ID_LOWER}`] = ''
      form[`onBehalfName_${SIGNATORY_2_ID_LOWER}`] = 'Someone else'
      form[`onBehalfEmail_${SIGNATORY_2_ID_LOWER}`] = 'mixed@mail.com'

      when(formValidator.validate(deepEqual(form), anything())).thenReturn(null)

      const result: Optional<ValidationErrors> = service.validateSignatoryInfo([signatory1, signatory2], form)

      assert.equal(Object.keys(result!).length, 2)
      assert.equal(result![`directorEmail_${SIGNATORY_1_ID_LOWER}`], `Enter a unique email address for ${SIGNATORY_1_NAME}`)
      assert.equal(result![`onBehalfEmail_${SIGNATORY_2_ID_LOWER}`], `Enter a unique email address for ${SIGNATORY_2_NAME}`)
    })

    it('should return no validation errors if unique emails have been provided', () => {
      const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

      form[`isSigning_${SIGNATORY_1_ID_LOWER}`] = SignatorySigning.WILL_SIGN
      form[`directorEmail_${SIGNATORY_1_ID_LOWER}`] = 'director@mail.com'
      form[`onBehalfName_${SIGNATORY_1_ID_LOWER}`] = ''
      form[`onBehalfEmail_${SIGNATORY_1_ID_LOWER}`] = ''

      form[`isSigning_${SIGNATORY_2_ID_LOWER}`] = SignatorySigning.ON_BEHALF
      form[`directorEmail_${SIGNATORY_2_ID_LOWER}`] = ''
      form[`onBehalfName_${SIGNATORY_2_ID_LOWER}`] = 'Mr Accountant'
      form[`onBehalfEmail_${SIGNATORY_2_ID_LOWER}`] = 'accountant@mail.com'

      when(formValidator.validate(deepEqual(form), anything())).thenReturn(null)

      const result: Optional<ValidationErrors> = service.validateSignatoryInfo([signatory1, signatory2], form)

      assert.isNull(result)
    })
  })
})
