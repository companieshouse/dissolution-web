import { assert } from 'chai'
import { generateDefineSignatoryInfoFormModel } from '../../fixtures/companyOfficers.fixtures'
import { generateDirectorToSign } from '../../fixtures/session.fixtures'

import { DefineSignatoryInfoFormModel } from 'app/models/form/defineSignatoryInfo.model'
import SignatorySigning from 'app/models/form/signatorySigning.enum'
import { DirectorToSign } from 'app/models/session/directorToSign.model'
import SignatoryService from 'app/services/signatories/signatory.service'

describe('SignatoryService', () => {

  const service: SignatoryService = new SignatoryService()

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
      contactForm[`directorEmail_${SIGNATORY_1_ID_LOWER}`] = 'DIRECTOR@mail.com'
      contactForm[`onBehalfName_${SIGNATORY_1_ID_LOWER}`] = ''
      contactForm[`onBehalfEmail_${SIGNATORY_1_ID_LOWER}`] = ''

      contactForm[`isSigning_${SIGNATORY_2_ID_LOWER}`] = SignatorySigning.WILL_SIGN
      contactForm[`directorEmail_${SIGNATORY_2_ID_LOWER}`] = 'otherdirector@mail.com'
      contactForm[`onBehalfName_${SIGNATORY_2_ID_LOWER}`] = ''
      contactForm[`onBehalfEmail_${SIGNATORY_2_ID_LOWER}`] = ''

      service.updateSignatoriesWithContactInfo([signatory1, signatory2], contactForm)

      assert.equal(signatory1.email, 'director@mail.com')
      assert.isUndefined(signatory1.onBehalfName)

      assert.equal(signatory2.email, 'otherdirector@mail.com')
      assert.isUndefined(signatory2.onBehalfName)
    })

    it('should update signatories with their contact info if someone will sign the application on behalf of them', () => {
      const contactForm: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

      contactForm[`isSigning_${SIGNATORY_1_ID_LOWER}`] = SignatorySigning.ON_BEHALF
      contactForm[`directorEmail_${SIGNATORY_1_ID_LOWER}`] = ''
      contactForm[`onBehalfName_${SIGNATORY_1_ID_LOWER}`] = 'Mr Accountant'
      contactForm[`onBehalfEmail_${SIGNATORY_1_ID_LOWER}`] = 'ACCOUNTANT@mail.com'

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
      contactForm[`onBehalfEmail_${SIGNATORY_1_ID_LOWER}`] = 'ACCOUNTANT@mail.com'

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
