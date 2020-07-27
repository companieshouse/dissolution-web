import 'reflect-metadata'

import { assert } from 'chai'
import { OK } from 'http-status-codes'
import request from 'supertest'
import { anything, instance, mock, when } from 'ts-mockito'
import { generateDissolutionSession } from '../fixtures/session.fixtures'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/viewFinalConfirmation.controller'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { VIEW_FINAL_CONFIRMATION_URI } from 'app/paths'
import SessionService from 'app/services/session/session.service'

describe('ViewFinalConfirmationController', () => {

  const APPLICATION_REFERENCE_NUMBER = 'OVFFTH'

  let session: SessionService

  beforeEach(() => {
    session = mock(SessionService)
  })

  describe('GET request', () => {
    it('should render the ViewFinalConfirmation page with correct reference number', async () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()
      dissolutionSession.applicationReferenceNumber = APPLICATION_REFERENCE_NUMBER

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
      })

      const res = await request(app)
        .get(VIEW_FINAL_CONFIRMATION_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h2', 'What to do next'))
      assert.isTrue(htmlAssertHelper.containsText('div.govuk-panel__body', APPLICATION_REFERENCE_NUMBER))
    })
  })
})
