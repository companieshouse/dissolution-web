import 'reflect-metadata'

import { assert } from 'chai'
import { MOVED_TEMPORARILY, OK } from 'http-status-codes'
import request from 'supertest'
import { anything, instance, mock, verify, when } from 'ts-mockito'
import { generateCheckYourAnswersDirector } from '../fixtures/checkYourAnswersDirector.fixtures'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/checkYourAnswers.controller'
import CheckYourAnswersDirectorMapper from 'app/mappers/check-your-answers/checkYourAnswersDirector.mapper'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import CheckYourAnswersDirector from 'app/models/view/checkYourAnswersDirector.model'
import { CHECK_YOUR_ANSWERS_URI, DEFINE_SIGNATORY_INFO_URI, REDIRECT_GATE_URI, SELECT_DIRECTOR_URI } from 'app/paths'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import SessionService from 'app/services/session/session.service'

import { createApp } from 'test/controllers/helpers/application.factory'
import { generateDirectorToSign, generateDissolutionSession } from 'test/fixtures/session.fixtures'

describe('CheckYourAnswersController', () => {
  let session: SessionService
  let service: DissolutionService
  let mapper: CheckYourAnswersDirectorMapper

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '01777777'
  const DIRECTOR_1_NAME = 'Geoff Smith'
  const DIRECTOR_1_EMAIL = 'test@mail.com'

  let dissolutionSession: DissolutionSession

  beforeEach(() => {
    session = mock(SessionService)
    service = mock(DissolutionService)
    mapper = mock(CheckYourAnswersDirectorMapper)

    when(session.getAccessToken(anything())).thenReturn(TOKEN)
    when(service.createDissolution(anything(), anything())).thenResolve('1234567')

    dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
  })

  describe('GET - ensure that page loads correctly', () => {
    it('render correct rows for single signing director', async () => {
      const director: CheckYourAnswersDirector = generateCheckYourAnswersDirector()
      director.name = DIRECTOR_1_NAME
      director.email = DIRECTOR_1_EMAIL
      director.isDirectorSigning = 'Yes'
      dissolutionSession.directorsToSign = [generateDirectorToSign()]

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(mapper.mapToCheckYourAnswersDirector(dissolutionSession.directorsToSign[0])).thenReturn(director)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CheckYourAnswersDirectorMapper).toConstantValue(instance(mapper))
      })

      const res = await request(app)
        .get(CHECK_YOUR_ANSWERS_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'Check your answers'))
      assert.isTrue(htmlAssertHelper.hasText('h2', DIRECTOR_1_NAME))
      assert.isTrue(htmlAssertHelper.hasText('#director-details-0 .director-email dd', 'test@mail.com'))
      assert.isTrue(htmlAssertHelper.hasText('#director-details-0 .director-signing dd', 'Yes'))
      assert.isTrue(htmlAssertHelper.selectorDoesNotExist('#director-details-0 .director-on-behalf-name dd'))

    })

    it('render correct rows for single director that is not signing personally', async () => {
      const director: CheckYourAnswersDirector = generateCheckYourAnswersDirector()
      director.name = DIRECTOR_1_NAME
      director.email = DIRECTOR_1_EMAIL
      director.isDirectorSigning = 'No'
      director.onBehalfName = 'Thor, God of Thunder'
      dissolutionSession.directorsToSign = [generateDirectorToSign()]

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(mapper.mapToCheckYourAnswersDirector(dissolutionSession.directorsToSign[0])).thenReturn(director)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CheckYourAnswersDirectorMapper).toConstantValue(instance(mapper))
      })

      const res = await request(app)
        .get(CHECK_YOUR_ANSWERS_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'Check your answers'))
      assert.isTrue(htmlAssertHelper.hasText('h2', DIRECTOR_1_NAME))
      assert.isTrue(htmlAssertHelper.hasText('#director-details-0 .director-on-behalf-name dd', 'Thor, God of Thunder'))
      assert.isTrue(htmlAssertHelper.hasText('#director-details-0 .director-email dd', 'test@mail.com'))
      assert.isTrue(htmlAssertHelper.hasText('#director-details-0 .director-signing dd', 'No'))
    })

    describe('back link', () => {
      it('should set back to the select director page when single director journey and applicant is the director', async () => {
        dissolutionSession.isMultiDirector = false
        dissolutionSession.isApplicantADirector = true

        when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
        when(mapper.mapToCheckYourAnswersDirector(anything())).thenReturn(generateCheckYourAnswersDirector())

        const app = createApp(container => {
          container.rebind(SessionService).toConstantValue(instance(session))
          container.rebind(CheckYourAnswersDirectorMapper).toConstantValue(instance(mapper))
        })

        const res = await request(app)
          .get(CHECK_YOUR_ANSWERS_URI)
          .expect(OK)

        const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

        assert.equal(htmlAssertHelper.getAttributeValue('.govuk-back-link', 'href'), SELECT_DIRECTOR_URI)
      })

      it('should set back to the define signatory info page when single director journey and applicant is not the director', async () => {
        dissolutionSession.isMultiDirector = false
        dissolutionSession.isApplicantADirector = false

        when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
        when(mapper.mapToCheckYourAnswersDirector(anything())).thenReturn(generateCheckYourAnswersDirector())

        const app = createApp(container => {
          container.rebind(SessionService).toConstantValue(instance(session))
          container.rebind(CheckYourAnswersDirectorMapper).toConstantValue(instance(mapper))
        })

        const res = await request(app)
          .get(CHECK_YOUR_ANSWERS_URI)
          .expect(OK)

        const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

        assert.equal(htmlAssertHelper.getAttributeValue('.govuk-back-link', 'href'), DEFINE_SIGNATORY_INFO_URI)
      })

      it('should set back to the define signatory info page when multi director journey and applicant is the director', async () => {
        dissolutionSession.isMultiDirector = true
        dissolutionSession.isApplicantADirector = true

        when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
        when(mapper.mapToCheckYourAnswersDirector(anything())).thenReturn(generateCheckYourAnswersDirector())

        const app = createApp(container => {
          container.rebind(SessionService).toConstantValue(instance(session))
          container.rebind(CheckYourAnswersDirectorMapper).toConstantValue(instance(mapper))
        })

        const res = await request(app)
          .get(CHECK_YOUR_ANSWERS_URI)
          .expect(OK)

        const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

        assert.equal(htmlAssertHelper.getAttributeValue('.govuk-back-link', 'href'), DEFINE_SIGNATORY_INFO_URI)
      })

      it('should set back to the define signatory info page when multi director journey and applicant is not the director', async () => {
        dissolutionSession.isMultiDirector = true
        dissolutionSession.isApplicantADirector = false

        when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
        when(mapper.mapToCheckYourAnswersDirector(anything())).thenReturn(generateCheckYourAnswersDirector())

        const app = createApp(container => {
          container.rebind(SessionService).toConstantValue(instance(session))
          container.rebind(CheckYourAnswersDirectorMapper).toConstantValue(instance(mapper))
        })

        const res = await request(app)
          .get(CHECK_YOUR_ANSWERS_URI)
          .expect(OK)

        const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

        assert.equal(htmlAssertHelper.getAttributeValue('.govuk-back-link', 'href'), DEFINE_SIGNATORY_INFO_URI)
      })
    })
  })

  describe('POST - create dissolution request', () => {
    it('should create dissolution', async () => {
      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(DissolutionService).toConstantValue(instance(service))
      })

      await request(app)
        .post(CHECK_YOUR_ANSWERS_URI)
        .expect(MOVED_TEMPORARILY)
        .expect('Location', REDIRECT_GATE_URI)

      verify(service.createDissolution(TOKEN, dissolutionSession)).once()
    })
  })
})
