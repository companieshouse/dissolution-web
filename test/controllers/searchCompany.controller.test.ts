import 'reflect-metadata'

import { assert } from 'chai'
import { Application } from 'express'
import { OK } from 'http-status-codes'
import request from 'supertest'

import { createAppWithFakeSession } from 'app/application.factory'
import 'app/controllers/searchCompany.controller'
import { SEARCH_COMPANY_URI } from 'app/paths'
  import TYPES from 'app/types'

describe('SearchCompanyController', () => {
  it('should return 200 when trying to access page with a session', async () => {
    const app: Application = createAppWithFakeSession(container => {
      container.bind(TYPES.ACCOUNT_WEB_URL).toConstantValue('')
    })
    const res = await request(app).get(SEARCH_COMPANY_URI).expect(OK)

    assert.include(res.text, 'Search Company Placeholder')
  })
})
