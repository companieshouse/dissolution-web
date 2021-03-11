import 'reflect-metadata'

import { assert } from 'chai'
import { Application } from 'express'
import { StatusCodes } from 'http-status-codes'
import request from 'supertest'
import { anything, instance, mock, when } from 'ts-mockito'
import { generateDissolutionGetResponse } from '../fixtures/dissolutionApi.fixtures'
import { generateDissolutionSession } from '../fixtures/session.fixtures'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/viewFinalConfirmation.controller'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import OfficerType from 'app/models/dto/officerType.enum'
import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { VIEW_FINAL_CONFIRMATION_URI } from 'app/paths'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import SessionService from 'app/services/session/session.service'

describe('ViewFinalConfirmationController', () => {

  const APPLICATION_REFERENCE_NUMBER = 'OVFFTH'

  let session: SessionService
  let dissolution: Optional<DissolutionGetResponse>
  let dissolutionService: DissolutionService
  let dissolutionSession: DissolutionSession
  let app: Application

  const TOKEN = 'some-token'

  beforeEach(() => {
    session = mock(SessionService)

    dissolutionService = mock(DissolutionService)

    dissolution = generateDissolutionGetResponse()

    dissolutionSession = generateDissolutionSession()
    dissolutionSession.applicationReferenceNumber = APPLICATION_REFERENCE_NUMBER

    app = createApp(container => {
      container.rebind(SessionService).toConstantValue(instance(session))
      container.rebind(DissolutionService).toConstantValue(instance(dissolutionService))
    })

    when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)
    when(session.getAccessToken(anything())).thenReturn(TOKEN)
    when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
  })

  describe('GET request', () => {
    it('should render the ViewFinalConfirmation page with correct reference number', async () => {

      const res = await request(app)
        .get(VIEW_FINAL_CONFIRMATION_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('#first-header', 'What to do next'))
      assert.isTrue(htmlAssertHelper.containsText('div.govuk-panel__body', APPLICATION_REFERENCE_NUMBER))
    })

    it('should render the ViewFinalConfirmation page with director text if the company is plc', async () => {
      dissolutionSession.officerType = OfficerType.DIRECTOR

      const res = await request(app)
        .get(VIEW_FINAL_CONFIRMATION_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('#first-header', 'What to do next'))
      assert.isTrue(htmlAssertHelper.containsText('#inform', 'A strike off notice for the company will be published in the local Gazette. After 2 months, the notice will expire.'))
    })

    it('should render the ViewFinalConfirmation page with member text if the company is LLP', async () => {
      dissolutionSession.officerType = OfficerType.MEMBER

      const res = await request(app)
        .get(VIEW_FINAL_CONFIRMATION_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('#first-header', 'What to do next'))
      assert.isTrue(htmlAssertHelper.containsText('#inform', 'A strike off notice for the company will be published in the local Gazette. After 2 months, the notice will expire.'))
    })
  })
})
