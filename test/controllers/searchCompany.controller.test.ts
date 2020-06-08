import 'reflect-metadata'

import { assert } from 'chai'
import { Application } from 'express'
import request from 'supertest'

import { createAppWithFakeSession } from 'app/application.factory'
import 'app/controllers/searchCompany.controller'
import { SEARCH_COMPANY_URI } from 'app/paths'

describe('SearchCompanyController', () => {
  it('should return 200 when trying to access page with a session', async () => {
    const app: Application = createAppWithFakeSession()
    const res = await request(app).get(SEARCH_COMPANY_URI).expect(200)

    assert.include(res.text, 'Search Company Placeholder')
  })
})
