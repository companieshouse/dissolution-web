import 'reflect-metadata'

import { assert } from 'chai'
import { OK } from 'http-status-codes'
import request from 'supertest'
import { anything, instance, mock, when } from 'ts-mockito'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/waitForOthersToSign.controller'
import OfficerType from 'app/models/dto/officerType.enum'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { WAIT_FOR_OTHERS_TO_SIGN_URI } from 'app/paths'
import SessionService from 'app/services/session/session.service'

import { generateDissolutionSession } from 'test/fixtures/session.fixtures'

let session: SessionService

const TOKEN = 'some-token'
const COMPANY_NUMBER = '01777777'

let dissolutionSession: DissolutionSession



beforeEach(() => {
  session = mock(SessionService)

  when(session.getAccessToken(anything())).thenReturn(TOKEN)

  dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
})
describe('WaitForOthersToSignController', () => {
  describe('GET request', () => {
    it('should render the WaitForOthers page with director text when company is plc', async () => {
      dissolutionSession.officerType = OfficerType.DIRECTOR
      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
      })

     const res = await request(app)
      .get(WAIT_FOR_OTHERS_TO_SIGN_URI)
      .expect(OK)

     const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

     assert.isTrue(htmlAssertHelper.hasText('h1', 'The directors must sign the application before you can submit it'))
    })

    it('should render the WaitForOthers page with member text when company is llp', async () => {
      dissolutionSession.officerType = OfficerType.MEMBER
      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
      })

      const res = await request(app)
        .get(WAIT_FOR_OTHERS_TO_SIGN_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'The members must sign the application before you can submit it'))
    })
  })
})
