import 'reflect-metadata'

import { Application } from 'express'
import { MOVED_TEMPORARILY } from 'http-status-codes'
import request from 'supertest'
import { anything, instance, mock, when } from 'ts-mockito'
import { generateDissolutionSession } from '../fixtures/session.fixtures'
import { createApp } from './helpers/application.factory'

import 'app/controllers/payment.controller'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { PAYMENT_URI, SEARCH_COMPANY_URI } from 'app/paths'
import PaymentService from 'app/services/payment/payment.service'
import SessionService from 'app/services/session/session.service'

describe('PaymentController', () => {

  let sessionService: SessionService
  let paymentService: PaymentService

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = 'ABC123'
  const REDIRECT_URL = 'http://some-payment-ui-url'

  let dissolutionSession: DissolutionSession

  before(() => {
    sessionService = mock(SessionService)
    paymentService = mock(PaymentService)

    dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
  })

  describe('GET - ensure that the payment page loads correctly', () => {
    function initApp(): Application {
      return createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(sessionService))
        container.rebind(PaymentService).toConstantValue(instance(paymentService))
      })
    }

    it('should redirect to the payment page if the application has not been paid for', async () => {
      when(sessionService.getAccessToken(anything())).thenReturn(TOKEN)
      when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(paymentService.generatePaymentURL(TOKEN, dissolutionSession, anything())).thenResolve(REDIRECT_URL)
      dissolutionSession.applicationPaid = false

      const app = initApp()

      await request(app)
        .get(PAYMENT_URI)
        .expect(MOVED_TEMPORARILY)
        .expect('Location', REDIRECT_URL)
    })

    it('should redirect to the search company page if the application has been paid for', async () => {
      when(sessionService.getAccessToken(anything())).thenReturn(TOKEN)
      when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(paymentService.generatePaymentURL(TOKEN, dissolutionSession, anything())).thenResolve(REDIRECT_URL)
      dissolutionSession.applicationPaid = true

      const app = initApp()

      await request(app)
        .get(PAYMENT_URI)
        .expect(MOVED_TEMPORARILY)
        .expect('Location', SEARCH_COMPANY_URI)
    })
  })
})
