import 'reflect-metadata'

import { assert } from 'chai'
import { Application, Request } from 'express'
import { BAD_REQUEST, MOVED_TEMPORARILY, OK } from 'http-status-codes'
import request from 'supertest'
import { anything, capture, deepEqual, instance, mock, verify, when } from 'ts-mockito'
import { ArgCaptor2 } from 'ts-mockito/lib/capture/ArgCaptor'
import { generateDefineSignatoryInfoFormModel } from '../fixtures/companyOfficers.fixtures'
import { generateValidationError } from '../fixtures/error.fixtures'
import { generateDirectorToSign, generateDissolutionSession } from '../fixtures/session.fixtures'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/defineSignatoryInfo.controller'
import { DefineSignatoryInfoFormModel, SignatorySigning } from 'app/models/form/defineSignatoryInfo.model'
import DirectorToSign from 'app/models/session/directorToSign.model'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import ValidationErrors from 'app/models/view/validationErrors.model'
import { CHECK_YOUR_ANSWERS_URI, DEFINE_SIGNATORY_INFO_URI, SELECT_DIRECTOR_URI, SELECT_SIGNATORIES_URI } from 'app/paths'
import SessionService from 'app/services/session/session.service'
import SignatoryService from 'app/services/signatories/signatory.service'
import FormValidator from 'app/utils/formValidator.util'

describe('DefineSignatoryInfoController', () => {

  let session: SessionService
  let validator: FormValidator
  let signatoryService: SignatoryService

  const APPLICANT_ID = '123'
  const SIGNATORY_1_ID = '456'
  const SIGNATORY_2_ID = '789'

  let dissolutionSession: DissolutionSession

  beforeEach(() => {
    session = mock(SessionService)
    validator = mock(FormValidator)
    signatoryService = mock(SignatoryService)

    const applicant: DirectorToSign = generateDirectorToSign()
    applicant.isApplicant = true
    applicant.id = APPLICANT_ID
    applicant.id = APPLICANT_ID

    const signatory1: DirectorToSign = generateDirectorToSign()
    signatory1.isApplicant = false
    signatory1.name = 'Jimmy McGuiness'
    signatory1.id = SIGNATORY_1_ID

    const signatory2: DirectorToSign = generateDirectorToSign()
    signatory2.isApplicant = false
    signatory2.name = 'Jane Smith'
    signatory2.id = SIGNATORY_2_ID

    dissolutionSession = generateDissolutionSession()
    dissolutionSession.directorsToSign = [applicant, signatory1, signatory2]
  })

  describe('GET', () => {
    it('should render the define signatory info page with one section per signatory', async () => {
      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
      })

      const res = await request(app)
        .get(DEFINE_SIGNATORY_INFO_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'How will the directors be signing the application?'))

      assert.isTrue(htmlAssertHelper.selectorDoesNotExist(`#signatory_${APPLICANT_ID}`))

      assert.isTrue(htmlAssertHelper.selectorExists(`#signatory_${SIGNATORY_1_ID}`))
      assert.isTrue(htmlAssertHelper.hasText(`#signatory_${SIGNATORY_1_ID} legend`, 'Jimmy McGuiness'))
      assert.isTrue(htmlAssertHelper.selectorExists(`#is-signing_${SIGNATORY_1_ID}`))
      assert.isTrue(htmlAssertHelper.selectorExists(`#is-signing_${SIGNATORY_1_ID}-2`))
      assert.isTrue(htmlAssertHelper.selectorExists(`#director-email_${SIGNATORY_1_ID}`))
      assert.isTrue(htmlAssertHelper.selectorExists(`#on-behalf-name_${SIGNATORY_1_ID}`))
      assert.isTrue(htmlAssertHelper.selectorExists(`#on-behalf-email_${SIGNATORY_1_ID}`))

      assert.isTrue(htmlAssertHelper.selectorExists(`#signatory_${SIGNATORY_2_ID}`))
      assert.isTrue(htmlAssertHelper.hasText(`#signatory_${SIGNATORY_2_ID} legend`, 'Jane Smith'))
      assert.isTrue(htmlAssertHelper.selectorExists(`#is-signing_${SIGNATORY_2_ID}`))
      assert.isTrue(htmlAssertHelper.selectorExists(`#is-signing_${SIGNATORY_2_ID}-2`))
      assert.isTrue(htmlAssertHelper.selectorExists(`#director-email_${SIGNATORY_2_ID}`))
      assert.isTrue(htmlAssertHelper.selectorExists(`#on-behalf-name_${SIGNATORY_2_ID}`))
      assert.isTrue(htmlAssertHelper.selectorExists(`#on-behalf-email_${SIGNATORY_2_ID}`))
    })

    it('should prepopulate the select director page with the selected director from session', async () => {
      const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

      form[`isSigning_${SIGNATORY_1_ID}`] = SignatorySigning.WILL_SIGN
      form[`directorEmail_${SIGNATORY_1_ID}`] = 'director@mail.com'
      form[`onBehalfName_${SIGNATORY_1_ID}`] = ''
      form[`onBehalfEmail_${SIGNATORY_1_ID}`] = ''

      form[`isSigning_${SIGNATORY_2_ID}`] = SignatorySigning.ON_BEHALF
      form[`directorEmail_${SIGNATORY_2_ID}`] = ''
      form[`onBehalfName_${SIGNATORY_2_ID}`] = 'Mr Accountant'
      form[`onBehalfEmail_${SIGNATORY_2_ID}`] = 'accountant@mail.com'

      dissolutionSession.defineSignatoryInfoForm = form

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
      })

      const res = await request(app)
        .get(DEFINE_SIGNATORY_INFO_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasAttribute(`#is-signing_${SIGNATORY_1_ID}`, 'checked'))
      assert.isFalse(htmlAssertHelper.hasAttribute(`#is-signing_${SIGNATORY_1_ID}-2`, 'checked'))
      assert.equal(htmlAssertHelper.getValue(`#director-email_${SIGNATORY_1_ID}`), 'director@mail.com')
      assert.isNull(htmlAssertHelper.getValue(`#on-behalf-name_${SIGNATORY_1_ID}`))
      assert.isNull(htmlAssertHelper.getValue(`#on-behalf-email_${SIGNATORY_1_ID}`))

      assert.isFalse(htmlAssertHelper.hasAttribute(`#is-signing_${SIGNATORY_2_ID}`, 'checked'))
      assert.isTrue(htmlAssertHelper.hasAttribute(`#is-signing_${SIGNATORY_2_ID}-2`, 'checked'))
      assert.isNull(htmlAssertHelper.getValue(`#director-email_${SIGNATORY_2_ID}`))
      assert.equal(htmlAssertHelper.getValue(`#on-behalf-name_${SIGNATORY_2_ID}`), 'Mr Accountant')
      assert.equal(htmlAssertHelper.getValue(`#on-behalf-email_${SIGNATORY_2_ID}`), 'accountant@mail.com')
    })

    describe('back button', () => {
      it('should set the button button to the select signatories page if multi director journey', async () => {
        dissolutionSession.isMultiDirector = true

        when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

        const app = createApp(container => {
          container.rebind(SessionService).toConstantValue(instance(session))
        })

        const res = await request(app)
          .get(DEFINE_SIGNATORY_INFO_URI)
          .expect(OK)

        const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

        assert.equal(htmlAssertHelper.getAttributeValue('.govuk-back-link', 'href'), SELECT_SIGNATORIES_URI)
      })

      it('should set the button button to the select director page if multi director journey', async () => {
        dissolutionSession.isMultiDirector = false

        when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

        const app = createApp(container => {
          container.rebind(SessionService).toConstantValue(instance(session))
        })

        const res = await request(app)
          .get(DEFINE_SIGNATORY_INFO_URI)
          .expect(OK)

        const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

        assert.equal(htmlAssertHelper.getAttributeValue('.govuk-back-link', 'href'), SELECT_DIRECTOR_URI)
      })
    })
  })

  describe('POST', () => {
    function initApp(): Application {
      return createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(FormValidator).toConstantValue(instance(validator))
        container.rebind(SignatoryService).toConstantValue(instance(signatoryService))
      })
    }

    it('should re-render the view with an error if validation fails', async () => {
      const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()
      const error: ValidationErrors = generateValidationError(`isSigning_${SIGNATORY_2_ID}`, 'some is signing error')

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(validator.validate(deepEqual(form), anything())).thenReturn(error)

      const app = initApp()

      const res = await request(app)
        .post(DEFINE_SIGNATORY_INFO_URI)
        .send(form)
        .expect(BAD_REQUEST)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.selectorExists('.govuk-error-summary'))
      assert.isTrue(htmlAssertHelper.containsText(`#is-signing_${SIGNATORY_2_ID}-error`, 'some is signing error'))
    })

    describe('session', () => {
      it('should not update session if nothing has changed', async () => {
        const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

        dissolutionSession.defineSignatoryInfoForm = form

        when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
        when(validator.validate(deepEqual(form), anything())).thenReturn(null)

        const app = initApp()

        await request(app)
          .post(DEFINE_SIGNATORY_INFO_URI)
          .send(form)
          .expect(MOVED_TEMPORARILY)

        verify(session.setDissolutionSession(anything(), anything())).never()
      })

      it('should store the form in session if validation passes', async () => {
        const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

        dissolutionSession.defineSignatoryInfoForm = undefined

        when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
        when(validator.validate(deepEqual(form), anything())).thenReturn(null)

        const app = initApp()

        await request(app)
          .post(DEFINE_SIGNATORY_INFO_URI)
          .send(form)
          .expect(MOVED_TEMPORARILY)

        verify(session.setDissolutionSession(anything(), anything())).once()

        const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
        const updatedSession: DissolutionSession = sessionCaptor.last()[1]

        assert.deepEqual(updatedSession.defineSignatoryInfoForm, form)
      })

      it('should update the signatories with the provided contact info if validation passes', async () => {
        const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

        when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
        when(validator.validate(deepEqual(form), anything())).thenReturn(null)

        const app = initApp()

        await request(app)
          .post(DEFINE_SIGNATORY_INFO_URI)
          .send(form)
          .expect(MOVED_TEMPORARILY)

        verify(signatoryService.updateSignatoriesWithContactInfo(anything(), deepEqual(form))).once()

        const signatoryCaptor: ArgCaptor2<DirectorToSign[], DefineSignatoryInfoFormModel> =
          capture<DirectorToSign[], DefineSignatoryInfoFormModel>(signatoryService.updateSignatoriesWithContactInfo)
        const signatories: DirectorToSign[] = signatoryCaptor.last()[0]

        assert.equal(signatories.length, 2)
        assert.equal(signatories[0].id, SIGNATORY_1_ID)
        assert.equal(signatories[1].id, SIGNATORY_2_ID)
      })
    })

    it('should redirect to the check your answers screen if validation passes', async () => {
      const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(validator.validate(deepEqual(form), anything())).thenReturn(null)

      const app = initApp()

      await request(app)
        .post(DEFINE_SIGNATORY_INFO_URI)
        .send(form)
        .expect(MOVED_TEMPORARILY)
        .expect('Location', CHECK_YOUR_ANSWERS_URI)
    })
  })
})
