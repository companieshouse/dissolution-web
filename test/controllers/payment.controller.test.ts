import 'reflect-metadata'

import { Application } from 'express'
import { StatusCodes } from 'http-status-codes'
import request from 'supertest'
import { anything, instance, mock, verify, when } from 'ts-mockito'
import { generateDissolutionSession } from '../fixtures/session.fixtures'
import { createApp } from './helpers/application.factory'

import 'app/controllers/payment.controller'
import ApplicationStatus from 'app/models/dto/applicationStatus.enum'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { PAYMENT_URI, SEARCH_COMPANY_URI } from 'app/paths'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import PaymentService from 'app/services/payment/payment.service'
import SessionService from 'app/services/session/session.service'

import { generateDissolutionGetResponse } from 'test/fixtures/dissolutionApi.fixtures'

describe('PaymentController', () => {

  let dissolutionService: DissolutionService
  let paymentService: PaymentService
  let sessionService: SessionService

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = 'ABC123'
  const REDIRECT_URL = 'http://some-payment-ui-url'

  let dissolution: DissolutionGetResponse
  let dissolutionSession: DissolutionSession

  before(() => {
    dissolutionService = mock(DissolutionService)
    paymentService = mock(PaymentService)
    sessionService = mock(SessionService)

    dissolution = generateDissolutionGetResponse()
    dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)

    when(sessionService.getAccessToken(anything())).thenReturn(TOKEN)
    when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession)
    when(paymentService.generatePaymentURL(TOKEN, dissolutionSession, anything())).thenResolve(REDIRECT_URL)
    when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)
  })

  describe('GET - ensure that the payment page loads correctly', () => {
    function initApp(): Application {
      return createApp(container => {
        container.rebind(DissolutionService).toConstantValue(instance(dissolutionService))
        container.rebind(SessionService).toConstantValue(instance(sessionService))
        container.rebind(PaymentService).toConstantValue(instance(paymentService))
      })
    }

    it('should redirect to the search company page if the application has been paid for', async () => {
      dissolution.application_status = ApplicationStatus.PAID

      const app = initApp()

      await request(app)
        .get(PAYMENT_URI)
        .expect(StatusCodes.MOVED_TEMPORARILY)
        .expect('Location', SEARCH_COMPANY_URI)

      verify(sessionService.setDissolutionSession(anything(), anything())).never()
    })

    it('should redirect to the payment page if the application has not been paid for', async () => {
      dissolution.application_status = ApplicationStatus.PENDING_PAYMENT

      const app = initApp()

      await request(app)
        .get(PAYMENT_URI)
        .expect(StatusCodes.MOVED_TEMPORARILY)
        .expect('Location', REDIRECT_URL)

      verify(sessionService.setDissolutionSession(anything(), anything())).once()
    })
  })
})
