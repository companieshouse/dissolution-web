import 'reflect-metadata'

import { assert } from 'chai'
import { OK } from 'http-status-codes'
import request from 'supertest'
import { anything, mock, when } from 'ts-mockito'
import { generateDissolutionSession } from '../fixtures/session.fixtures'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/waitForOthersToSign.controller'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { VIEW_FINAL_CONFIRMATION } from 'app/paths'
import SessionService from 'app/services/session/session.service'

describe('ViewFinalConfirmationController', () => {

  let session: SessionService

  const applicationReferenceNumber = 'OVFFTH'

  let dissolutionSession: DissolutionSession

  beforeEach(() => {
    session = mock(SessionService)

    dissolutionSession = generateDissolutionSession(applicationReferenceNumber)

    when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
  })

  describe('GET request', () => {
    it('should render the ViewFinalConfirmation page', async () => {
        const app = createApp()

        const res = await request(app)
          .get(VIEW_FINAL_CONFIRMATION)
          .expect(OK)

        const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

        assert.isTrue(htmlAssertHelper.hasText('h3', 'What to do next'))
      })

    it('should populate the reference number of the application', async () => {
      const applicationReferenceNumber: ApplicationReferenceNumber = generateApplicationReferenceNumber()
      applicationReferenceNumber.applicationReferenceNumber = 'OVFFTH'

      when(SessionService.getApplicationReferenceNumber(applicationReferenceNumber)).thenResolve(applicationReferenceNumber)
    })
})