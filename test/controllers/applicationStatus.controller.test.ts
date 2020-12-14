import 'reflect-metadata'

import { assert } from 'chai'
import { Application, Request } from 'express'
import { StatusCodes } from 'http-status-codes'
import request from 'supertest'
import { anything, capture, instance, mock, verify, when } from 'ts-mockito'
import { ArgCaptor2 } from 'ts-mockito/lib/capture/ArgCaptor'
import { generateDissolutionSession } from '../fixtures/session.fixtures'
import { createApp } from './helpers/application.factory'

import 'app/controllers/applicationStatus.controller'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { APPLICATION_STATUS_URI, CHANGE_DETAILS_URI } from 'app/paths'
import SessionService from 'app/services/session/session.service'

describe('ApplicationStatusController', () => {

  let session: SessionService

  before(() => {
    session = mock(SessionService)
  })

  describe('Change', () => {
    it('should save the signatory ID in sesison and redirect to change details', async () => {
      const signatoryId: string = 'abc123'

      const dissolutionSession: DissolutionSession = generateDissolutionSession()
      dissolutionSession.signatoryIdToEdit = undefined

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

      const app: Application = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
      })

      await request(app)
        .get(`${APPLICATION_STATUS_URI}/${signatoryId}/change`)
        .expect(StatusCodes.MOVED_TEMPORARILY)
        .expect('Location', CHANGE_DETAILS_URI)

      verify(session.setDissolutionSession(anything(), anything())).once()

      const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
      const updatedSession: DissolutionSession = sessionCaptor.last()[1]

      assert.equal(updatedSession.signatoryIdToEdit, signatoryId)
    })
  })
})
