import 'reflect-metadata'

import { assert } from 'chai'
import { Application } from 'express'
import { StatusCodes } from 'http-status-codes'
import request from 'supertest'
import { anything, instance, mock, when } from 'ts-mockito'
import { generatePaymentSummary } from '../fixtures/payment.fixtures'
import { generateDissolutionSession } from '../fixtures/session.fixtures'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/paymentReview.controller'
import ApplicationStatus from 'app/models/dto/applicationStatus.enum'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { HOW_DO_YOU_WANT_TO_PAY_URI, PAYMENT_REVIEW_URI, SEARCH_COMPANY_URI } from 'app/paths'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import PaymentService from 'app/services/payment/payment.service'
import SessionService from 'app/services/session/session.service'
import TYPES from 'app/types'

import { generateDissolutionGetResponse } from 'test/fixtures/dissolutionApi.fixtures'

describe('PaymentReviewController', () => {

  let dissolutionService: DissolutionService
  let sessionService: SessionService
  let paymentService: PaymentService

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = 'ABC123'
  const REDIRECT_URL = 'http://some-payment-ui-url'

  let dissolution: DissolutionGetResponse
  let dissolutionSession: DissolutionSession

  function initApp(): Application {
    return createApp(container => {
      container.rebind(DissolutionService).toConstantValue(instance(dissolutionService))
      container.rebind(SessionService).toConstantValue(instance(sessionService))
      container.rebind(PaymentService).toConstantValue(instance(paymentService))
      container.rebind(TYPES.PAY_BY_ACCOUNT_FEATURE_ENABLED).toConstantValue(1)
    })
  }

  before(() => {
    dissolutionService = mock(DissolutionService)
    sessionService = mock(SessionService)
    paymentService = mock(PaymentService)

    dissolution = generateDissolutionGetResponse()
    dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
  })

  describe('GET - ensure that the payment review page loads correctly', () => {
    it('should redirect to the search company page if the application has already been paid for', async () => {
      when(sessionService.getAccessToken(anything())).thenReturn(TOKEN)
      when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)

      dissolution.application_status = ApplicationStatus.PAID

      const app = initApp()

      await request(app)
        .get(PAYMENT_REVIEW_URI)
        .expect(StatusCodes.MOVED_TEMPORARILY)
        .expect('Location', SEARCH_COMPANY_URI)
    })

    it('should redirect to the payment review page if the application has not been paid for', async () => {
      when(sessionService.getAccessToken(anything())).thenReturn(TOKEN)
      when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)
      when(dissolutionService.getDissolutionPaymentSummary(dissolutionSession)).thenResolve(generatePaymentSummary())

      dissolution.application_status = ApplicationStatus.PENDING_PAYMENT

      const app = initApp()

      const res = await request(app)
        .get(PAYMENT_REVIEW_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'Review your payment'))
      assert.isTrue(htmlAssertHelper.hasText('#item-0', 'Some payment description'))
      assert.isTrue(htmlAssertHelper.hasText('#amount-to-pay-0', '£8.00'))
      assert.isTrue(htmlAssertHelper.hasText('#total_cost', '£16.00'))
    })
  })

  describe('POST - ensure that the payment review page submits successfully', () => {
    it('should redirect to the how do you want to pay page (if the pay by account feature toggle is on)', async () => {
      const app = initApp()

      await request(app)
        .post(PAYMENT_REVIEW_URI)
        .expect(StatusCodes.MOVED_TEMPORARILY)
        .expect('Location', HOW_DO_YOU_WANT_TO_PAY_URI)
    })

    it('should redirect to the GOV.UK Pay journey (if the pay by account feature toggle is off)', async () => {
      when(sessionService.getAccessToken(anything())).thenReturn(TOKEN)
      when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(paymentService.generatePaymentURL(TOKEN, dissolutionSession, anything())).thenResolve(REDIRECT_URL)

      const app: Application = createApp(container => {
        container.rebind(DissolutionService).toConstantValue(instance(dissolutionService))
        container.rebind(SessionService).toConstantValue(instance(sessionService))
        container.rebind(PaymentService).toConstantValue(instance(paymentService))
        container.rebind(TYPES.PAY_BY_ACCOUNT_FEATURE_ENABLED).toConstantValue(0)
      })

      await request(app)
        .post(PAYMENT_REVIEW_URI)
        .expect(StatusCodes.MOVED_TEMPORARILY)
        .expect('Location', REDIRECT_URL)
    })
  })
})
