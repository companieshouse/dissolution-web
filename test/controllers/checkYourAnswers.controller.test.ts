import 'reflect-metadata'

import { assert } from 'chai'
import { Request } from 'express'
import { MOVED_TEMPORARILY } from 'http-status-codes'
import request from 'supertest'
import { anything, capture, instance, mock, verify, when } from 'ts-mockito'
import { ArgCaptor2 } from 'ts-mockito/lib/capture/ArgCaptor'

import 'app/controllers/checkYourAnswers.controller'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { CHECK_YOUR_ANSWERS_URI, ROOT_URI } from 'app/paths'
import { DissolutionService } from 'app/services/dissolution/dissolution.service'
import SessionService from 'app/services/session/session.service'

import { createApp } from 'test/controllers/helpers/application.factory'
import { generateDissolutionSession } from 'test/fixtures/session.fixtures'

describe('CheckYourAnswersController', () => {
  let session: SessionService
  let service: DissolutionService

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '01777777'
  const REFERENCE_NUMBER = '1234567'

  let dissolutionSession: DissolutionSession

  beforeEach(() => {
    session = mock(SessionService)
    service = mock(DissolutionService)

    when(session.getAccessToken(anything())).thenReturn(TOKEN)
    when(service.createDissolution(anything(), anything())).thenResolve('1234567')

    dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
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

      // TODO Check if page has been rendered correctly (res.include())
    })
  })
})