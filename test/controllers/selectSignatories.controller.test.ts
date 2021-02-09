import 'reflect-metadata'

import { assert } from 'chai'
import { Application, Request } from 'express'
import { StatusCodes } from 'http-status-codes'
import request from 'supertest'
import { anything, capture, deepEqual, instance, mock, verify, when } from 'ts-mockito'
import { ArgCaptor2 } from 'ts-mockito/lib/capture/ArgCaptor'
import {
  generateDirectorDetails,
  generateSelectDirectorFormModel,
  generateSelectSignatoriesFormModel
} from '../fixtures/companyOfficers.fixtures'
import { generateValidationError } from '../fixtures/error.fixtures'
import { generateDirectorToSign, generateDissolutionSession, TOKEN } from '../fixtures/session.fixtures'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/selectSignatories.controller'
import DirectorToSignMapper from 'app/mappers/check-your-answers/directorToSign.mapper'
import OfficerType from 'app/models/dto/officerType.enum'
import SelectSignatoriesFormModel from 'app/models/form/selectSignatories.model'
import { DirectorToSign } from 'app/models/session/directorToSign.model'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import DirectorDetails from 'app/models/view/directorDetails.model'
import ValidationErrors from 'app/models/view/validationErrors.model'
import { DEFINE_SIGNATORY_INFO_URI, SELECT_SIGNATORIES_URI } from 'app/paths'
import CompanyOfficersService from 'app/services/company-officers/companyOfficers.service'
import SessionService from 'app/services/session/session.service'
import SignatoryService from 'app/services/signatories/signatory.service'
import FormValidator from 'app/utils/formValidator.util'

describe('SelectSignatoriesController', () => {

  let session: SessionService
  let officerService: CompanyOfficersService
  let signatoryService: SignatoryService
  let validator: FormValidator
  let mapper: DirectorToSignMapper

  const COMPANY_NUMBER = '01777777'

  const DIRECTOR_1_ID = '123'
  const DIRECTOR_2_ID = '456'
  const NOT_A_DIRECTOR_ID = 'other'

  let dissolutionSession: DissolutionSession

  beforeEach(() => {
    session = mock(SessionService)
    officerService = mock(CompanyOfficersService)
    signatoryService = mock(SignatoryService)
    validator = mock(FormValidator)
    mapper = mock(DirectorToSignMapper)

    when(session.getAccessToken(anything())).thenReturn(TOKEN)

    dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
    dissolutionSession.selectDirectorForm = generateSelectDirectorFormModel(NOT_A_DIRECTOR_ID)
  })

  describe('GET - ensure that page loads correctly', () => {
    it('should render the select signatories page with the relevant options', async () => {
      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER, NOT_A_DIRECTOR_ID)).thenResolve([
        {...generateDirectorDetails(), id: DIRECTOR_1_ID},
        {...generateDirectorDetails(), id: DIRECTOR_2_ID}
      ])

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
      })

      const res = await request(app)
        .get(SELECT_SIGNATORIES_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.equal(htmlAssertHelper.getValue('#signatories'), DIRECTOR_1_ID)
      assert.equal(htmlAssertHelper.getValue('#signatories-2'), DIRECTOR_2_ID)
    })

    it('should render the select signatories page with directors for DS01', async () => {
      dissolutionSession.officerType = OfficerType.DIRECTOR

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER, NOT_A_DIRECTOR_ID)).thenResolve([
        {...generateDirectorDetails(), id: DIRECTOR_1_ID},
        {...generateDirectorDetails(), id: DIRECTOR_2_ID}
      ])

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
      })

      const res = await request(app)
        .get(SELECT_SIGNATORIES_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'Which directors will be signing the application?'))
    })

    it('should render the select signatories page with members for LLDS01', async () => {
      dissolutionSession.officerType = OfficerType.MEMBER

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER, NOT_A_DIRECTOR_ID)).thenResolve([
        {...generateDirectorDetails(), id: DIRECTOR_1_ID},
        {...generateDirectorDetails(), id: DIRECTOR_2_ID}
      ])

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
      })

      const res = await request(app)
        .get(SELECT_SIGNATORIES_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'Which members will be signing the application?'))
    })

    it('should prepopulate the select signatories page with the selected signatories from session', async () => {
      dissolutionSession.selectSignatoriesForm = generateSelectSignatoriesFormModel(DIRECTOR_2_ID)

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER, NOT_A_DIRECTOR_ID)).thenResolve([
        {...generateDirectorDetails(), id: DIRECTOR_1_ID},
        {...generateDirectorDetails(), id: DIRECTOR_2_ID}
      ])

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
      })

      const res = await request(app)
        .get(SELECT_SIGNATORIES_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isFalse(htmlAssertHelper.hasAttribute('#signatories', 'checked'))
      assert.isTrue(htmlAssertHelper.hasAttribute('#signatories-2', 'checked'))
    })
  })

  describe('POST - ensure form submission is handled correctly', () => {
    function initApp(): Application {
      return createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
        container.rebind(FormValidator).toConstantValue(instance(validator))
        container.rebind(DirectorToSignMapper).toConstantValue(instance(mapper))
      })
    }

    beforeEach(() => {
      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(signatoryService.getMinimumNumberOfSignatories(2, NOT_A_DIRECTOR_ID)).thenReturn(2)
    })

    it('should re-render the view with an error if validation fails', async () => {
      const form: SelectSignatoriesFormModel = generateSelectSignatoriesFormModel()
      const error: ValidationErrors = generateValidationError('signatories', 'some signatories error')

      when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER, NOT_A_DIRECTOR_ID)).thenResolve([
        {...generateDirectorDetails(), id: DIRECTOR_1_ID},
        {...generateDirectorDetails(), id: DIRECTOR_2_ID}
      ])
      when(validator.validate(deepEqual(form), anything())).thenReturn(error)

      const app = initApp()

      const res = await request(app)
        .post(SELECT_SIGNATORIES_URI)
        .send(form)
        .expect(StatusCodes.BAD_REQUEST)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.selectorExists('.govuk-error-summary'))
      assert.isTrue(htmlAssertHelper.containsText('#signatories-error', 'some signatories error'))
    })

    describe('session', () => {
      it('should not update session if nothing has changed', async () => {
        const form: SelectSignatoriesFormModel = generateSelectSignatoriesFormModel(DIRECTOR_1_ID)

        dissolutionSession.selectSignatoriesForm = form

        when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER, NOT_A_DIRECTOR_ID)).thenResolve([
          {...generateDirectorDetails(), id: DIRECTOR_1_ID},
          {...generateDirectorDetails(), id: DIRECTOR_2_ID}
        ])
        when(validator.validate(deepEqual(form), anything())).thenReturn(null)

        const app = initApp()

        await request(app)
          .post(SELECT_SIGNATORIES_URI)
          .send(form)
          .expect(StatusCodes.MOVED_TEMPORARILY)

        verify(session.setDissolutionSession(anything(), anything())).never()
      })

      it('should store the form in session if validation passes', async () => {
        const form: SelectSignatoriesFormModel = generateSelectSignatoriesFormModel(DIRECTOR_1_ID)

        when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER, NOT_A_DIRECTOR_ID)).thenResolve([
          {...generateDirectorDetails(), id: DIRECTOR_1_ID},
          {...generateDirectorDetails(), id: DIRECTOR_2_ID}
        ])
        when(validator.validate(deepEqual(form), anything())).thenReturn(null)

        const app = initApp()

        await request(app)
          .post(SELECT_SIGNATORIES_URI)
          .send(form)
          .expect(StatusCodes.MOVED_TEMPORARILY)

        verify(session.setDissolutionSession(anything(), anything())).once()

        const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
        const updatedSession: DissolutionSession = sessionCaptor.last()[1]

        assert.deepEqual(updatedSession.selectSignatoriesForm, form)
      })

      it('should clear the existing signatories and save the new selection', async () => {
        const form: SelectSignatoriesFormModel = generateSelectSignatoriesFormModel(DIRECTOR_1_ID)

        const director1: DirectorDetails = {...generateDirectorDetails(), id: DIRECTOR_1_ID, name: 'Signatory 1'}
        const director2: DirectorDetails = {...generateDirectorDetails(), id: DIRECTOR_2_ID, name: 'Signatory 2'}

        const signatory: DirectorToSign = generateDirectorToSign()

        when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER, NOT_A_DIRECTOR_ID)).thenResolve([director1, director2])
        when(validator.validate(deepEqual(form), anything())).thenReturn(null)
        when(mapper.mapAsSignatory(director1)).thenReturn(signatory)

        const app = initApp()

        await request(app)
          .post(SELECT_SIGNATORIES_URI)
          .send(form)
          .expect(StatusCodes.MOVED_TEMPORARILY)

        verify(mapper.mapAsSignatory(director1)).once()
        verify(session.setDissolutionSession(anything(), anything())).once()

        const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
        const updatedSession: DissolutionSession = sessionCaptor.last()[1]

        assert.equal(updatedSession.directorsToSign!.length, 1)
        assert.equal(updatedSession.directorsToSign![0], signatory)
      })
    })

    it('should redirect to the define signatories info screen if validation passes', async () => {
      const form: SelectSignatoriesFormModel = generateSelectSignatoriesFormModel(DIRECTOR_1_ID)

      when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER, NOT_A_DIRECTOR_ID)).thenResolve([
        {...generateDirectorDetails(), id: DIRECTOR_1_ID},
        {...generateDirectorDetails(), id: DIRECTOR_2_ID}
      ])
      when(validator.validate(deepEqual(form), anything())).thenReturn(null)

      const app = initApp()

      await request(app)
        .post(SELECT_SIGNATORIES_URI)
        .send(form)
        .expect(StatusCodes.MOVED_TEMPORARILY)
        .expect('Location', DEFINE_SIGNATORY_INFO_URI)
    })
  })
})
