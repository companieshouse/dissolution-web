import 'reflect-metadata'

import { assert } from 'chai'
import { Application } from 'express'
import { StatusCodes } from 'http-status-codes'
import request from 'supertest'
import { anything, deepEqual, instance, mock, when } from 'ts-mockito'
import { generateDissolutionGetResponse } from '../fixtures/dissolutionApi.fixtures'
import { generateValidationError } from '../fixtures/error.fixtures'
import { generatePayByAccountDetailsForm } from '../fixtures/payment.fixtures'
import { generateDissolutionSession } from '../fixtures/session.fixtures'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/payByAccountDetails.controller'
import ApplicationStatus from 'app/models/dto/applicationStatus.enum'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import PayByAccountDetailsFormModel from 'app/models/form/payByAccountDetails.model'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import ValidationErrors from 'app/models/view/validationErrors.model'
import { PAY_BY_ACCOUNT_DETAILS_URI, SEARCH_COMPANY_URI, VIEW_FINAL_CONFIRMATION_URI } from 'app/paths'
import payByAccountDetailsSchema from 'app/schemas/payByAccountDetails.schema'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import PayByAccountService from 'app/services/payment/payByAccount.service'
import SessionService from 'app/services/session/session.service'
import TYPES from 'app/types'
import FormValidator from 'app/utils/formValidator.util'

describe('PayByAccountDetailsController', () => {

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = 'ABC123'

  let sessionService: SessionService
  let dissolutionService: DissolutionService
  let validator: FormValidator
  let payByAccountService: PayByAccountService

  function initApp(): Application {
    return createApp(container => {
      container.rebind(SessionService).toConstantValue(instance(sessionService))
      container.rebind(DissolutionService).toConstantValue(instance(dissolutionService))
      container.rebind(FormValidator).toConstantValue(instance(validator))
      container.rebind(PayByAccountService).toConstantValue(instance(payByAccountService))
    })
  }

  beforeEach(() => {
    sessionService = mock(SessionService)
    dissolutionService = mock(DissolutionService)
    validator = mock(FormValidator)
    payByAccountService = mock(PayByAccountService)
  })

  describe('GET request', () => {
    let dissolutionSession: DissolutionSession
    let dissolutionGetResponse: DissolutionGetResponse

    beforeEach(() => {
      dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
      dissolutionGetResponse = generateDissolutionGetResponse()

      when(sessionService.getAccessToken(anything())).thenReturn(TOKEN)
      when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolutionGetResponse)
    })

    it('should reject with an error (if toggle is disabled)', async () => {
      const app: Application = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(sessionService))
        container.rebind(DissolutionService).toConstantValue(instance(dissolutionService))
        container.rebind(FormValidator).toConstantValue(instance(validator))
        container.rebind(PayByAccountService).toConstantValue(instance(payByAccountService))
        container.rebind(TYPES.PAY_BY_ACCOUNT_FEATURE_ENABLED).toConstantValue(0)
      })

      await request(app)
        .get(PAY_BY_ACCOUNT_DETAILS_URI)
        .expect(StatusCodes.NOT_FOUND)
    })

    it('should redirect to the search company page if the application has been paid for', async () => {
      dissolutionGetResponse.application_status = ApplicationStatus.PAID

      const app: Application = initApp()

      await request(app)
        .get(PAY_BY_ACCOUNT_DETAILS_URI)
        .expect(StatusCodes.MOVED_TEMPORARILY)
        .expect('Location', SEARCH_COMPANY_URI)
    })

    it('should render the pay by account details page (if toggle is enabled)', async () => {
      const app: Application = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(sessionService))
        container.rebind(DissolutionService).toConstantValue(instance(dissolutionService))
        container.rebind(FormValidator).toConstantValue(instance(validator))
        container.rebind(PayByAccountService).toConstantValue(instance(payByAccountService))
        container.rebind(TYPES.PAY_BY_ACCOUNT_FEATURE_ENABLED).toConstantValue(1)
      })

      const res = await request(app)
        .get(PAY_BY_ACCOUNT_DETAILS_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'Enter your details to pay by account'))
    })
  })

  describe('POST request', () => {
    const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm()

    it('should re-render the view with an error if validation fails', async () => {
      const error: ValidationErrors = generateValidationError('presenterId', 'Some presenter ID error')

      when(validator.validate(deepEqual(form), payByAccountDetailsSchema)).thenReturn(error)

      const app: Application = initApp()

      const res = await request(app)
        .post(PAY_BY_ACCOUNT_DETAILS_URI)
        .send(form)
        .expect(StatusCodes.BAD_REQUEST)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'Enter your details to pay by account'))
      assert.isTrue(htmlAssertHelper.selectorExists('.govuk-error-summary'))
      assert.isTrue(htmlAssertHelper.containsText('#presenter-id-error', 'Some presenter ID error'))
    })

    it('should re-render the view with an error if validation passes but account does not exist', async () => {
      when(validator.validate(deepEqual(form), payByAccountDetailsSchema)).thenReturn(null)
      when(payByAccountService.getAccountNumber(form)).thenResolve()

      const app: Application = initApp()

      const res = await request(app)
        .post(PAY_BY_ACCOUNT_DETAILS_URI)
        .send(form)
        .expect(StatusCodes.BAD_REQUEST)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'Enter your details to pay by account'))
      assert.isTrue(htmlAssertHelper.selectorExists('.govuk-error-summary'))
      assert.isTrue(htmlAssertHelper.containsText('#presenter-auth-code-error', 'Your Presenter ID or Presenter authentication code is incorrect'))
    })

    it('should redirect to confirmation screen if validation passes and account exists', async () => {
      when(validator.validate(deepEqual(form), payByAccountDetailsSchema)).thenReturn(null)
      when(payByAccountService.getAccountNumber(deepEqual(form))).thenResolve('1234567890')

      const app: Application = initApp()

      await request(app)
        .post(PAY_BY_ACCOUNT_DETAILS_URI)
        .send(form)
        .expect(StatusCodes.MOVED_TEMPORARILY)
        .expect('Location', VIEW_FINAL_CONFIRMATION_URI)
    })
  })
})
