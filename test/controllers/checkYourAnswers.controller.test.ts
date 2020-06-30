import 'reflect-metadata'

import { assert } from 'chai'
import { Request } from 'express'
import { MOVED_TEMPORARILY, OK } from 'http-status-codes'
import request from 'supertest'
import { anything, capture, instance, mock, verify, when } from 'ts-mockito'
import { ArgCaptor2 } from 'ts-mockito/lib/capture/ArgCaptor'
import { generateCheckYourAnswersDirector } from '../fixtures/checkYourAnswersDirector.fixtures'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/checkYourAnswers.controller'
import CheckYourAnswersDirectorMapper from 'app/mappers/check-your-answers/checkYourAnswersDirector.mapper'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import CheckYourAnswersDirector from 'app/models/view/checkYourAnswersDirector.model'
import { CHECK_YOUR_ANSWERS_URI, ROOT_URI } from 'app/paths'
import { DissolutionService } from 'app/services/dissolution/dissolution.service'
import SessionService from 'app/services/session/session.service'

import { createApp } from 'test/controllers/helpers/application.factory'
import { generateDirectorToSign, generateDissolutionSession } from 'test/fixtures/session.fixtures'

describe('CheckYourAnswersController', () => {
  let session: SessionService
  let service: DissolutionService
  let mapper: CheckYourAnswersDirectorMapper

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '01777777'
  const REFERENCE_NUMBER = '1234567'
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
    it('render single director on page', async () => {
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
      assert.isTrue(htmlAssertHelper.hasText('#director-details .director-email dd', 'test@mail.com'))
      assert.isTrue(htmlAssertHelper.hasText('#director-details .director-signing dd', 'Yes'))
    })
  })

  describe('POST - create dissolution request', () => {
    it('should add company reference number to dissolution session', async () => {
      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(DissolutionService).toConstantValue(instance(service))
      })

      await request(app)
        .post(CHECK_YOUR_ANSWERS_URI)
        .expect(MOVED_TEMPORARILY)
        .expect('Location',`${ROOT_URI}/endorse-company-closure-certificate`)

      verify(session.setDissolutionSession(anything(), anything())).once()
      verify(service.createDissolution(TOKEN, dissolutionSession)).once()

      const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
      const updatedSession: DissolutionSession = sessionCaptor.last()[1]

      assert.equal(updatedSession.applicationReferenceNumber, REFERENCE_NUMBER)
    })
  })
})
