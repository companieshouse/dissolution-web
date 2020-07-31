import 'reflect-metadata'

import { assert } from 'chai'
import { OK } from 'http-status-codes'
import request from 'supertest'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/certificateSigned.controller'
import { CERTIFICATE_SIGNED_URI } from 'app/paths'

describe('CertificateSignedController', () => {
  describe('GET request', () => {
    it('should render the CertificateSigned page', async () => {
     const app = createApp()

     const res = await request(app)
      .get(CERTIFICATE_SIGNED_URI)
      .expect(OK)

     const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

     assert.isTrue(htmlAssertHelper.hasText('h1', 'Application signed'))
    })
  })
})
