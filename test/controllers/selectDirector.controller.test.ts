import 'reflect-metadata'

import { assert } from 'chai'
import { BAD_REQUEST, MOVED_TEMPORARILY, OK } from 'http-status-codes'
import request from 'supertest'
import { anything, deepEqual, instance, mock, when } from 'ts-mockito'
import { generateDirectorDetails, generateSelectDirectorFormModel } from '../fixtures/companyOfficers.fixtures'
import { generateValidationError } from '../fixtures/error.fixtures'
import { createApp } from './helpers/application.factory'
import { HtmlAssertHelper } from './helpers/htmlAssert.helper'

import 'app/controllers/selectDirector.controller'
import SelectDirectorFormModel from 'app/models/selectDirector.model'
import ValidationErrors from 'app/models/validationErrors'
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

  beforeEach(() => {
    session = mock(SessionService)
    officerService = mock(CompanyOfficersService)
    validator = mock(FormValidator)

    when(session.getAccessToken(anything())).thenReturn(TOKEN)
  })

  describe('GET - ensure that page loads correctly', () => {
    it('should render the select director page with the relevant options', async () => {
      when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
        { ...generateDirectorDetails(), id: '123' },
        { ...generateDirectorDetails(), id: '456' }
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
      assert.equal(htmlAssertHelper.getValue('#select-director'), '123')
      assert.equal(htmlAssertHelper.getValue('#select-director-2'), '456')
      assert.equal(htmlAssertHelper.getValue('#select-director-4'), 'other')
    })
  })

  describe('POST - ensure form submission is handled correctly', () => {
    it('should re-render the view with an error if validation fails', async () => {
      const form: SelectDirectorFormModel = generateSelectDirectorFormModel()
      const error: ValidationErrors = generateValidationError('director', 'some director error')

      when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
        { ...generateDirectorDetails(), id: '123' },
        { ...generateDirectorDetails(), id: '456' }
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

    it('should redirect to check your answers if company is single director and director is selected', async () => {
      const form: SelectDirectorFormModel = generateSelectDirectorFormModel('123')

      when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
        { ...generateDirectorDetails(), id: '123' }
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
      const form: SelectDirectorFormModel = generateSelectDirectorFormModel('other')

      when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
        { ...generateDirectorDetails(), id: '123' }
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
      const form: SelectDirectorFormModel = generateSelectDirectorFormModel('123')

      when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
        { ...generateDirectorDetails(), id: '123' },
        { ...generateDirectorDetails(), id: '456' }
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
      const form: SelectDirectorFormModel = generateSelectDirectorFormModel('other')

      when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
        { ...generateDirectorDetails(), id: '123' },
        { ...generateDirectorDetails(), id: '456' }
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
