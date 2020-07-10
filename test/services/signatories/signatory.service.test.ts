import { assert } from 'chai'
import { instance, mock, verify, when } from 'ts-mockito'
import { generateDefineSignatoryInfoFormModel } from '../../fixtures/companyOfficers.fixtures'
import { generateValidationError } from '../../fixtures/error.fixtures'
import { generateDirectorToSign } from '../../fixtures/session.fixtures'

import { DefineSignatoryInfoFormModel, SignatorySigning } from 'app/models/form/defineSignatoryInfo.model'
import Optional from 'app/models/optional'
import DirectorToSign from 'app/models/session/directorToSign.model'
import ValidationErrors from 'app/models/view/validationErrors.model'
import SignatoryService from 'app/services/signatories/signatory.service'
import SignatoryValidator from 'app/services/signatories/signatory.validator'

describe('SignatoryService', () => {

  let service: SignatoryService

  let validator: SignatoryValidator

  beforeEach(() => {
    validator = mock(SignatoryValidator)

    service = new SignatoryService(instance(validator))
  })

  describe('getMinimumNumberOfSignatories', () => {
    it(`should calculate the majority of signatories to select if the applicant is a director and there is an even number of total
      directors`, () => {
      const result: number = service.getMinimumNumberOfSignatories(5, '123')

      assert.equal(result, 3)
    })

    it(`should calculate the majority of signatories to select if the applicant is not a director and there is an even number of total
      directors`, () => {
      const result: number = service.getMinimumNumberOfSignatories(6, 'other')

      assert.equal(result, 4)
    })

    it(`should calculate the majority of signatories to select if the applicant is a director and there is an odd number of total
      directors`, () => {
      const result: number = service.getMinimumNumberOfSignatories(4, '123')

      assert.equal(result, 2)
    })

    it(`should calculate the majority of signatories to select if the applicant is not a director and there is an odd number of total
      directors`, () => {
      const result: number = service.getMinimumNumberOfSignatories(5, 'other')

      assert.equal(result, 3)
    })

    it(`should ensure that all signatories must be selected if company only has 2 directors and applicant is not a director`, () => {
      const result: number = service.getMinimumNumberOfSignatories(2, 'other')

      assert.equal(result, 2)
    })

    it(`should ensure that all signatories must be selected if company only has 2 directors and applicant is a director`, () => {
      const result: number = service.getMinimumNumberOfSignatories(1, 'other')

      assert.equal(result, 1)
    })
  })

  describe('validateSignatoryInfo', () => {
    it('should validate the signatory info and return the result', () => {
      const signatories: DirectorToSign[] = [
        generateDirectorToSign(),
        generateDirectorToSign()
      ]

      const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

      const error: ValidationErrors = generateValidationError('signatory', 'some signatory info error')

      when(validator.validateSignatoryInfo(signatories, form)).thenReturn(error)

      const result: Optional<ValidationErrors> = service.validateSignatoryInfo(signatories, form)

      assert.equal(result, error)

      verify(validator.validateSignatoryInfo(signatories, form)).once()
    })
  })

  describe('updateSignatoriesWithContactInfo', () => {
    const SIGNATORY_1_ID = '123'
    const SIGNATORY_2_ID = '456'

    const SIGNATORY_1_ID_LOWER = SIGNATORY_1_ID.toLowerCase()
    const SIGNATORY_2_ID_LOWER = SIGNATORY_2_ID.toLowerCase()

    let signatory1: DirectorToSign
    let signatory2: DirectorToSign

    beforeEach(() => {
      signatory1 = generateDirectorToSign()
      signatory1.id = SIGNATORY_1_ID

      signatory2 = generateDirectorToSign()
      signatory2.id = SIGNATORY_2_ID
    })

    it('should update signatories with their contact info if they will sign the application themselves', () => {
      const contactForm: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

      contactForm[`isSigning_${SIGNATORY_1_ID_LOWER}`] = SignatorySigning.WILL_SIGN
      contactForm[`directorEmail_${SIGNATORY_1_ID_LOWER}`] = 'director@mail.com'
      contactForm[`onBehalfName_${SIGNATORY_1_ID_LOWER}`] = ''
      contactForm[`onBehalfEmail_${SIGNATORY_1_ID_LOWER}`] = ''

      contactForm[`isSigning_${SIGNATORY_2_ID_LOWER}`] = SignatorySigning.WILL_SIGN
      contactForm[`directorEmail_${SIGNATORY_2_ID_LOWER}`] = 'otherDirector@mail.com'
      contactForm[`onBehalfName_${SIGNATORY_2_ID_LOWER}`] = ''
      contactForm[`onBehalfEmail_${SIGNATORY_2_ID_LOWER}`] = ''

      service.updateSignatoriesWithContactInfo([signatory1, signatory2], contactForm)

      assert.equal(signatory1.email, 'director@mail.com')
      assert.isUndefined(signatory1.onBehalfName)

      assert.equal(signatory2.email, 'otherDirector@mail.com')
      assert.isUndefined(signatory2.onBehalfName)
    })

    it('should update signatories with their contact info if someone will sign the application on behalf of them', () => {
      const contactForm: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

      contactForm[`isSigning_${SIGNATORY_1_ID_LOWER}`] = SignatorySigning.ON_BEHALF
      contactForm[`directorEmail_${SIGNATORY_1_ID_LOWER}`] = ''
      contactForm[`onBehalfName_${SIGNATORY_1_ID_LOWER}`] = 'Mr Accountant'
      contactForm[`onBehalfEmail_${SIGNATORY_1_ID_LOWER}`] = 'accountant@mail.com'

      contactForm[`isSigning_${SIGNATORY_2_ID_LOWER}`] = SignatorySigning.ON_BEHALF
      contactForm[`directorEmail_${SIGNATORY_2_ID_LOWER}`] = ''
      contactForm[`onBehalfName_${SIGNATORY_2_ID_LOWER}`] = 'Miss Solicitor'
      contactForm[`onBehalfEmail_${SIGNATORY_2_ID_LOWER}`] = 'solicitor@mail.com'

      service.updateSignatoriesWithContactInfo([signatory1, signatory2], contactForm)

      assert.equal(signatory1.email, 'accountant@mail.com')
      assert.equal(signatory1.onBehalfName, 'Mr Accountant')

      assert.equal(signatory2.email, 'solicitor@mail.com')
      assert.equal(signatory2.onBehalfName, 'Miss Solicitor')
    })

    it('should handle multiple signatories selecting different options for signing preference', () => {
      const contactForm: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

      contactForm[`isSigning_${SIGNATORY_1_ID_LOWER}`] = SignatorySigning.ON_BEHALF
      contactForm[`directorEmail_${SIGNATORY_1_ID_LOWER}`] = ''
      contactForm[`onBehalfName_${SIGNATORY_1_ID_LOWER}`] = 'Mr Accountant'
      contactForm[`onBehalfEmail_${SIGNATORY_1_ID_LOWER}`] = 'accountant@mail.com'

      contactForm[`isSigning_${SIGNATORY_2_ID_LOWER}`] = SignatorySigning.WILL_SIGN
      contactForm[`directorEmail_${SIGNATORY_2_ID_LOWER}`] = 'director@mail.com'
      contactForm[`onBehalfName_${SIGNATORY_2_ID_LOWER}`] = ''
      contactForm[`onBehalfEmail_${SIGNATORY_2_ID_LOWER}`] = ''

      service.updateSignatoriesWithContactInfo([signatory1, signatory2], contactForm)

      assert.equal(signatory1.email, 'accountant@mail.com')
      assert.equal(signatory1.onBehalfName, 'Mr Accountant')

      assert.equal(signatory2.email, 'director@mail.com')
      assert.isUndefined(signatory2.onBehalfName)
    })
  })
})
