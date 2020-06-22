import 'reflect-metadata'

import { assert } from 'chai'
import { Application } from 'express'
import { OK } from 'http-status-codes'
import request from 'supertest'
import { createApp } from './helpers/application.factory'

import 'app/controllers/searchCompany.controller'
import { SEARCH_COMPANY_URI } from 'app/paths'

describe('SearchCompanyController', () => {
  it('should render the search company page', async () => {
    const app: Application = createApp()

    const res = await request(app).get(SEARCH_COMPANY_URI).expect(OK)

    // TODO Replace with actual page components
    assert.include(res.text, 'Search Company Placeholder')
  })
})
