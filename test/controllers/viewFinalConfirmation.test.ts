import 'reflect-metadata'

import { assert } from 'chai'
import { OK } from 'http-status-codes'
import request from 'supertest'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/waitForOthersToSign.controller'
import { VIEW_FINAL_CONFIRMATION } from 'app/paths'

describe('ViewFinalConfirmationController', () => {
  describe('GET request', () => {
    it('should render the ViewFinalConfirmation page', async () => {
        const app = createApp()

        const res = await request(app)
          .get(VIEW_FINAL_CONFIRMATION)
          .expect(OK)

        const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

        assert.isTrue(htmlAssertHelper.hasText('h3', 'What to do next'))
      })
    })
})