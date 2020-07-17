import 'reflect-metadata'

import { assert } from 'chai'
import { OK } from 'http-status-codes'
import request from 'supertest'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/waitForOthersToSign.controller'
import { WAIT_FOR_OTHERS_TO_SIGN_URI } from 'app/paths'

describe('WaitForOthersToSignController', () => {
  describe('GET request', () => {
    it('should render the WaitForOthers page', async () => {
        const app = createApp()

        const res = await request(app)
          .get(WAIT_FOR_OTHERS_TO_SIGN_URI)
          .expect(OK)

        const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

        assert.isTrue(htmlAssertHelper.hasText('h1', 'You must ask the other directors or members to sign the application'))
      })
    })
})
