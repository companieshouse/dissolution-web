import 'reflect-metadata'

import { assert } from 'chai'
import { OK } from 'http-status-codes'
import request from 'supertest'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/notSelectedSignatory.controller'
import { NOT_SELECTED_SIGNATORY } from 'app/paths'

describe('NotSelectedSignatoryController', () => {
  describe('GET request', () => {
    it('should render the NotSelectedSignatory page', async () => {
      const app = createApp()

      const res = await request(app)
        .get(NOT_SELECTED_SIGNATORY)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'Email address not authorised to sign'))
    })
  })
})
