import 'reflect-metadata'

import { assert } from 'chai'
import { Application } from 'express'
import { OK } from 'http-status-codes'
import { createApp } from '../application.factory'

import 'app/controllers/landing.controller'

import { setupSuperTest } from 'test/supertest.factory'

const app: Application = createApp()

const req = setupSuperTest(app)

describe('LandingController', () => {
  it('should render the landing page', async () => {
    const res = await req.get('/').expect(OK)

    assert.include(res.text, 'Use this service to get your NodeJS application up and running.')
  })
})
