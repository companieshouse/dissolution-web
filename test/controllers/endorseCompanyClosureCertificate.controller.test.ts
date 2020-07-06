import 'reflect-metadata'

import { assert } from 'chai'
import { OK } from 'http-status-codes'
import request from 'supertest'
import { anything, instance, mock, when } from 'ts-mockito'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/endorseCompanyClosureCertificate.controller'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI} from 'app/paths'
import SessionService from 'app/services/session/session.service'

import { generateApprovalData } from 'test/fixtures/dissolutionApi.fixtures'
import { generateDissolutionSession } from 'test/fixtures/session.fixtures'

describe('EndorseCompanyClosureCertificateController', () => {

  let session: SessionService

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '01777777'

  let dissolutionSession: DissolutionSession

  beforeEach(() => {
    session = mock(SessionService)

    dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
    dissolutionSession.approval = generateApprovalData()
    dissolutionSession.approval.companyName = 'Company 1'
    dissolutionSession.approval.companyNumber = '123456789'
    dissolutionSession.approval.applicant = 'John Smith'

    when(session.getAccessToken(anything())).thenReturn(TOKEN)
    when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
  })

  describe('GET request', () => {
    it('should render the view company information page with company info', async () => {

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
      })

      const res = await request(app)
        .get(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'Application to close a company (DS01)'))
      assert.include(res.text, 'Company 1')
      assert.include(res.text, '123456789')
      assert.include(res.text, 'John Smith')
    })
  })
})
