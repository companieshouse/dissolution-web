import 'reflect-metadata'

import { assert } from 'chai'
import { Application } from 'express'
import { OK } from 'http-status-codes'
import request from 'supertest'
import { createApp } from './application.factory'

import ValidationErrors from 'app/models/validationErrors'
import SearchCompanyFormModel from 'app/models/searchCompany.model'

import 'app/controllers/searchCompany.controller'
import { SEARCH_COMPANY_URI } from 'app/paths'

const app: Application = createApp()

describe('SearchCompanyController', () => {
  describe('GET request', () => {
    it('should render the search company page', async () => {
    const res = await request(app).get(SEARCH_COMPANY_URI).expect(OK)
    assert.include(res.text, 'What is the company number?')
  })
})

describe('POST request', () => {
  it('should redirect successfully if validator returns no errors', async () => {
    const testObject = {test: 'data'}



    
    await request(app)
      .post(ROOT_URI)
      .expect(MOVED_TEMPORARILY)
      .expect('Location', WHO_TO_TELL_URI)
  })
})
})
