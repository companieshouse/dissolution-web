import 'reflect-metadata'

import { assert } from 'chai'
import { Application } from 'express'
import { OK } from 'http-status-codes'
import request from 'supertest'
import { createApp } from './application.factory'

import 'app/controllers/landing.controller'

const app: Application = createApp()

describe('LandingController', () => {
  it('should render the landing page', async () => {
    const res = await request(app).get('/close-a-company').expect(OK)

    assert.include(res.text, 'Use this service to get your NodeJS application up and running.')
  })
})
