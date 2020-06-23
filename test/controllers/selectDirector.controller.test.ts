import 'reflect-metadata'

import { assert } from 'chai'
import { Request } from 'express'
import { BAD_REQUEST, MOVED_TEMPORARILY, OK } from 'http-status-codes'
import request from 'supertest'
import { anything, capture, deepEqual, instance, mock, verify, when } from 'ts-mockito'
import { ArgCaptor2 } from 'ts-mockito/lib/capture/ArgCaptor'
import { generateDirectorDetails, generateSelectDirectorFormModel } from '../fixtures/companyOfficers.fixtures'
import { generateValidationError } from '../fixtures/error.fixtures'
import { generateDissolutionSession } from '../fixtures/session.fixtures'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/selectDirector.controller'
import SelectDirectorFormModel from 'app/models/form/selectDirector.model'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import ValidationErrors from 'app/models/view/validationErrors.model'
import { CHECK_YOUR_ANSWERS_URI, DEFINE_SIGNATORY_INFO_URI, SELECT_DIRECTOR_URI, SELECT_SIGNATORIES_URI } from 'app/paths'
import selectDirectorSchema from 'app/schemas/selectDirector.schema'
import CompanyOfficersService from 'app/services/company-officers/companyOfficers.service'
import SessionService from 'app/services/session/session.service'
import FormValidator from 'app/utils/formValidator.util'

describe('SelectDirectorController', () => {

  let session: SessionService
  let officerService: CompanyOfficersService
  let validator: FormValidator

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '01777777'

  const DIRECTOR_1_ID = '123'
  const DIRECTOR_2_ID = '456'
  const NOT_A_DIRECTOR_ID = 'other'

  let dissolutionSession: DissolutionSession

  beforeEach(() => {
    session = mock(SessionService)
    officerService = mock(CompanyOfficersService)
    validator = mock(FormValidator)

    when(session.getAccessToken(anything())).thenReturn(TOKEN)

    dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
  })

  describe('GET - ensure that page loads correctly', () => {
    it('should render the select director page with the relevant options', async () => {
      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
        { ...generateDirectorDetails(), id: DIRECTOR_1_ID },
        { ...generateDirectorDetails(), id: DIRECTOR_2_ID }
      ])

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
      })

      const res = await request(app)
        .get(SELECT_DIRECTOR_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'Which director are you?'))
      assert.equal(htmlAssertHelper.getValue('#select-director'), DIRECTOR_1_ID)
      assert.equal(htmlAssertHelper.getValue('#select-director-2'), DIRECTOR_2_ID)
      assert.equal(htmlAssertHelper.getValue('#select-director-4'), NOT_A_DIRECTOR_ID)
    })

    it('should prepopulate the select director page with the selected director from session', async () => {
      dissolutionSession.selectDirectorForm = generateSelectDirectorFormModel(DIRECTOR_2_ID)

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
        { ...generateDirectorDetails(), id: DIRECTOR_1_ID },
        { ...generateDirectorDetails(), id: DIRECTOR_2_ID }
      ])

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
      })

      const res = await request(app)
        .get(SELECT_DIRECTOR_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isFalse(htmlAssertHelper.hasAttribute('#select-director', 'checked'))
      assert.isTrue(htmlAssertHelper.hasAttribute('#select-director-2', 'checked'))
      assert.isFalse(htmlAssertHelper.hasAttribute('#select-director-4', 'checked'))
    })
  })

  describe('POST - ensure form submission is handled correctly', () => {
    beforeEach(() => when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession))

    it('should re-render the view with an error if validation fails', async () => {
      const form: SelectDirectorFormModel = generateSelectDirectorFormModel()
      const error: ValidationErrors = generateValidationError('director', 'some director error')

      when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
        { ...generateDirectorDetails(), id: DIRECTOR_1_ID },
        { ...generateDirectorDetails(), id: DIRECTOR_2_ID }
      ])
      when(validator.validate(deepEqual(form), selectDirectorSchema)).thenReturn(error)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
        container.rebind(FormValidator).toConstantValue(instance(validator))
      })

      const res = await request(app)
        .post(SELECT_DIRECTOR_URI)
        .send(form)
        .expect(BAD_REQUEST)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.selectorExists('.govuk-error-summary'))
      assert.isTrue(htmlAssertHelper.containsText('#select-director-error', 'some director error'))
    })

    describe('session', () => {
      it('should store the form in session if validation passes', async () => {
        const form: SelectDirectorFormModel = generateSelectDirectorFormModel(DIRECTOR_1_ID)

        when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
          { ...generateDirectorDetails(), id: DIRECTOR_1_ID }
        ])
        when(validator.validate(deepEqual(form), selectDirectorSchema)).thenReturn(null)

        const app = createApp(container => {
          container.rebind(SessionService).toConstantValue(instance(session))
          container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
          container.rebind(FormValidator).toConstantValue(instance(validator))
        })

        await request(app)
          .post(SELECT_DIRECTOR_URI)
          .send(form)
          .expect(MOVED_TEMPORARILY)

        verify(session.setDissolutionSession(anything(), anything())).once()

        const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
        const updatedSession: DissolutionSession = sessionCaptor.last()[1]

        assert.deepEqual(updatedSession.selectDirectorForm, form)
      })

      it('should store the director details and email if applicant is a director', async () => {
        const directorName: string = 'Some Director'
        const directorEmail: string = 'some@mail.com'

        const form: SelectDirectorFormModel = generateSelectDirectorFormModel(DIRECTOR_1_ID)

        when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
          { ...generateDirectorDetails(), id: DIRECTOR_1_ID, name: directorName }
        ])
        when(validator.validate(deepEqual(form), selectDirectorSchema)).thenReturn(null)
        when(session.getUserEmail(anything())).thenReturn(directorEmail)

        const app = createApp(container => {
          container.rebind(SessionService).toConstantValue(instance(session))
          container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
          container.rebind(FormValidator).toConstantValue(instance(validator))
        })

        await request(app)
          .post(SELECT_DIRECTOR_URI)
          .send(form)
          .expect(MOVED_TEMPORARILY)

        verify(session.setDissolutionSession(anything(), anything())).once()

        const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
        const updatedSession: DissolutionSession = sessionCaptor.last()[1]

        assert.equal(updatedSession.directorsToSign!.length, 1)
        assert.equal(updatedSession.directorsToSign![0].id, DIRECTOR_1_ID)
        assert.equal(updatedSession.directorsToSign![0].name, directorName)
        assert.equal(updatedSession.directorsToSign![0].email, directorEmail)
      })

      it('should not store the director details if applicant is not a director', async () => {
        const form: SelectDirectorFormModel = generateSelectDirectorFormModel(NOT_A_DIRECTOR_ID)

        when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
          { ...generateDirectorDetails(), id: DIRECTOR_1_ID }
        ])
        when(validator.validate(deepEqual(form), selectDirectorSchema)).thenReturn(null)

        const app = createApp(container => {
          container.rebind(SessionService).toConstantValue(instance(session))
          container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
          container.rebind(FormValidator).toConstantValue(instance(validator))
        })

        await request(app)
          .post(SELECT_DIRECTOR_URI)
          .send(form)
          .expect(MOVED_TEMPORARILY)

        verify(session.setDissolutionSession(anything(), anything())).once()

        const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
        const updatedSession: DissolutionSession = sessionCaptor.last()[1]

        assert.isEmpty(updatedSession.directorsToSign)
      })
    })

    describe('redirect', () => {
      it('should redirect to check your answers if company is single director and director is selected', async () => {
        const form: SelectDirectorFormModel = generateSelectDirectorFormModel(DIRECTOR_1_ID)

        when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
          { ...generateDirectorDetails(), id: DIRECTOR_1_ID }
        ])
        when(validator.validate(deepEqual(form), selectDirectorSchema)).thenReturn(null)

        const app = createApp(container => {
          container.rebind(SessionService).toConstantValue(instance(session))
          container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
          container.rebind(FormValidator).toConstantValue(instance(validator))
        })

        await request(app)
          .post(SELECT_DIRECTOR_URI)
          .send(form)
          .expect(MOVED_TEMPORARILY)
          .expect('Location', CHECK_YOUR_ANSWERS_URI)
      })

      it('should redirect to signatory info if company is single director and director is not selected', async () => {
        const form: SelectDirectorFormModel = generateSelectDirectorFormModel(NOT_A_DIRECTOR_ID)

        when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
          { ...generateDirectorDetails(), id: DIRECTOR_1_ID }
        ])
        when(validator.validate(deepEqual(form), selectDirectorSchema)).thenReturn(null)

        const app = createApp(container => {
          container.rebind(SessionService).toConstantValue(instance(session))
          container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
          container.rebind(FormValidator).toConstantValue(instance(validator))
        })

        await request(app)
          .post(SELECT_DIRECTOR_URI)
          .send(form)
          .expect(MOVED_TEMPORARILY)
          .expect('Location', DEFINE_SIGNATORY_INFO_URI)
      })

      it('should redirect to select signatories if company is multi director and director is selected', async () => {
        const form: SelectDirectorFormModel = generateSelectDirectorFormModel(DIRECTOR_1_ID)

        when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
          { ...generateDirectorDetails(), id: DIRECTOR_1_ID },
          { ...generateDirectorDetails(), id: DIRECTOR_2_ID }
        ])
        when(validator.validate(deepEqual(form), selectDirectorSchema)).thenReturn(null)

        const app = createApp(container => {
          container.rebind(SessionService).toConstantValue(instance(session))
          container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
          container.rebind(FormValidator).toConstantValue(instance(validator))
        })

        await request(app)
          .post(SELECT_DIRECTOR_URI)
          .send(form)
          .expect(MOVED_TEMPORARILY)
          .expect('Location', SELECT_SIGNATORIES_URI)
      })

      it('should redirect to select signatories if company is multi director and director is not selected', async () => {
        const form: SelectDirectorFormModel = generateSelectDirectorFormModel(NOT_A_DIRECTOR_ID)

        when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
          { ...generateDirectorDetails(), id: DIRECTOR_1_ID },
          { ...generateDirectorDetails(), id: DIRECTOR_2_ID }
        ])
        when(validator.validate(deepEqual(form), selectDirectorSchema)).thenReturn(null)

        const app = createApp(container => {
          container.rebind(SessionService).toConstantValue(instance(session))
          container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
          container.rebind(FormValidator).toConstantValue(instance(validator))
        })

        await request(app)
          .post(SELECT_DIRECTOR_URI)
          .send(form)
          .expect(MOVED_TEMPORARILY)
          .expect('Location', SELECT_SIGNATORIES_URI)
      })
    })
  })
})
