import 'reflect-metadata'

import { assert } from 'chai'
import { Request } from 'express'
import { Application } from 'express'
import { OK } from 'http-status-codes'
import request from 'supertest'
import { anything, capture, instance, mock, when } from 'ts-mockito'
import { ArgCaptor2 } from 'ts-mockito/lib/capture/ArgCaptor'
import { generateDissolutionSession } from '../fixtures/session.fixtures'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/viewFinalConfirmation.controller'
import OfficerType from 'app/models/dto/officerType.enum'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { VIEW_FINAL_CONFIRMATION_URI } from 'app/paths'
import SessionService from 'app/services/session/session.service'

describe('ViewFinalConfirmationController', () => {

  const APPLICATION_REFERENCE_NUMBER = 'OVFFTH'

  let session: SessionService
  let dissolutionSession: DissolutionSession
  let app: Application

  beforeEach(() => {
    session = mock(SessionService)

    dissolutionSession = generateDissolutionSession()
    dissolutionSession.applicationReferenceNumber = APPLICATION_REFERENCE_NUMBER

    app = createApp(container => {
      container.rebind(SessionService).toConstantValue(instance(session))
    })

    when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
  })

  describe('GET request', () => {
    it('should render the ViewFinalConfirmation page with correct reference number', async () => {

      const res = await request(app)
        .get(VIEW_FINAL_CONFIRMATION_URI)
        .expect(OK)

      const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
      const updatedSession: DissolutionSession = sessionCaptor.last()[1]

      assert.isTrue(updatedSession.isApplicationAlreadyPaid)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h2', 'What to do next'))
      assert.isTrue(htmlAssertHelper.containsText('div.govuk-panel__body', APPLICATION_REFERENCE_NUMBER))
    })

    it('should render the ViewFinalConfirmation page with director text if the company is plc', async () => {
      dissolutionSession.officerType = OfficerType.DIRECTOR

      const res = await request(app)
        .get(VIEW_FINAL_CONFIRMATION_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h2', 'What to do next'))
      assert.isTrue(htmlAssertHelper.containsText('#inform', 'You must inform all directors that the application has been submitted, including those who signed it.'))
    })

    it('should render the ViewFinalConfirmation page with member text if the company is LLP', async () => {
      dissolutionSession.officerType = OfficerType.MEMBER

      const res = await request(app)
        .get(VIEW_FINAL_CONFIRMATION_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h2', 'What to do next'))
      assert.isTrue(htmlAssertHelper.containsText('#inform', 'You must inform all members that the application has been submitted, including those who signed it.'))
    })
  })
})
