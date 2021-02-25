import 'reflect-metadata'

import { assert } from 'chai'
import { Application, Request } from 'express'
import { StatusCodes } from 'http-status-codes'
import request from 'supertest'
import { anything, capture, instance, mock, verify, when } from 'ts-mockito'
import { ArgCaptor2 } from 'ts-mockito/lib/capture/ArgCaptor'
import { generateDissolutionGetResponse } from '../fixtures/dissolutionApi.fixtures'
import { generateDirectorToRemind, generateDissolutionSession, EMAIL } from '../fixtures/session.fixtures'
import { generateViewApplicationStatusModel, generateViewApplicationStatusSignatory } from '../fixtures/viewApplicationStatus.fixtures'
import { createApp } from './helpers/application.factory'

import 'app/controllers/applicationStatus.controller'
import ViewApplicationStatusMapper from 'app/mappers/view-application-status/viewApplicationStatus.mapper'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse.ts'
import { DirectorToRemind } from 'app/models/session/directorToSign.model'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { ViewApplicationStatus } from 'app/models/view/viewApplicationStatus.model'
import { APPLICATION_STATUS_URI, CHANGE_DETAILS_URI, WAIT_FOR_OTHERS_TO_SIGN_URI } from 'app/paths'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import SessionService from 'app/services/session/session.service'

describe('ApplicationStatusController', () => {

  let session: SessionService
  let dissolutionService: DissolutionService
  let dissolutionSession: DissolutionSession
  let viewApplicationStatus: ViewApplicationStatus
  let dissolutionGetResponse: DissolutionGetResponse
  let viewApplicationStatusMapper: ViewApplicationStatusMapper

  beforeEach(() => {
    session = mock(SessionService)
    dissolutionService = mock(DissolutionService)
    viewApplicationStatusMapper = mock(ViewApplicationStatusMapper)
    dissolutionGetResponse = generateDissolutionGetResponse()
    dissolutionSession = generateDissolutionSession()
  })

  describe('Change', () => {
    it('should save the signatory ID in sesison and redirect to change details', async () => {
      const signatoryId: string = 'abc123'

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

  describe('Send-email', () => {
    it('Should save the email reminder status in the session and redirect to send-email', async () => {

      viewApplicationStatus = generateViewApplicationStatusModel()

      viewApplicationStatus.signatories = [
        { ...generateViewApplicationStatusSignatory(), name: 'Jane Smith', email: 'jane@mail.com' },
        { ...generateViewApplicationStatusSignatory(), name: 'Test One', email: 'test@mail.com' }
      ]

      const app: Application = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(DissolutionService).toConstantValue(instance(dissolutionService))
        container.rebind(ViewApplicationStatusMapper).toConstantValue(instance(viewApplicationStatusMapper))
      })

      when(dissolutionService.sendEmailNotification(dissolutionSession.companyNumber!, EMAIL)).thenResolve(true)
      when(dissolutionService.getDissolution(anything(), dissolutionSession)).thenResolve(dissolutionGetResponse)
      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(viewApplicationStatusMapper.mapToViewModel(dissolutionSession, dissolutionGetResponse, true)).thenReturn(viewApplicationStatus)

      await request(app)
        .get(`${APPLICATION_STATUS_URI}/${EMAIL}/send-email`)
        .expect(StatusCodes.MOVED_TEMPORARILY)
        .expect('Location', WAIT_FOR_OTHERS_TO_SIGN_URI)

      const reminderList: DirectorToRemind[] = [generateDirectorToRemind()]

      assert.equal(dissolutionSession.remindDirectorList.length, reminderList.length)
      assert.equal(dissolutionSession.remindDirectorList[0].id, reminderList[0].id)
      assert.equal(dissolutionSession.remindDirectorList[0].reminderSent, reminderList[0].reminderSent)
    })
  })
})
