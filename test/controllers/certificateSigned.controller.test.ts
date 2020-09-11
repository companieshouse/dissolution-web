import 'reflect-metadata'

import { assert } from 'chai'
import { Application } from 'express'
import { OK } from 'http-status-codes'
import request from 'supertest'
import { anything, instance, mock, when } from 'ts-mockito'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/certificateSigned.controller'
import OfficerType from 'app/models/dto/officerType.enum'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { CERTIFICATE_SIGNED_URI } from 'app/paths'
import SessionService from 'app/services/session/session.service'

import { generateDissolutionSession } from 'test/fixtures/session.fixtures'

let session: SessionService

const COMPANY_NUMBER = '01777777'

let app: Application
let dissolutionSession: DissolutionSession

beforeEach(() => {
  session = mock(SessionService)

  dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)

  app = createApp(container => {
    container.rebind(SessionService).toConstantValue(instance(session))
  })

  when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
})

describe('CertificateSignedController', () => {
  describe('GET request', () => {
    it('should render the CertificateSigned page with director text when the company is plc', async () => {
      dissolutionSession.officerType = OfficerType.DIRECTOR

      const res = await request(app)
        .get(CERTIFICATE_SIGNED_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'Application signed'))
      assert.isTrue(htmlAssertHelper.hasText('#signatures', 'We need to receive signatures from all signing directors before the person making the application can pay for and submit it. It may take some time for others to sign.'))
      assert.isTrue(htmlAssertHelper.hasText('#parties', 'The directors must then send this to all interested parties within 7 days of submission.'))
    })

    it('should render the CertificateSigned page with member text if the company is LLP', async () => {
      dissolutionSession.officerType = OfficerType.MEMBER

      const res = await request(app)
        .get(CERTIFICATE_SIGNED_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'Application signed'))
      assert.isTrue(htmlAssertHelper.hasText('#signatures', 'We need to receive signatures from all signing members before the person making the application can pay for and submit it. It may take some time for others to sign.'))
      assert.isTrue(htmlAssertHelper.hasText('#parties', 'The members must then send this to all interested parties within 7 days of submission.'))
    })
  })
})
