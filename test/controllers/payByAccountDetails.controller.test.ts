import "reflect-metadata"

import { assert } from "chai"
import { Application, Request } from "express"
import { StatusCodes } from "http-status-codes"
import request from "supertest"
import { anything, capture, deepEqual, instance, mock, when } from "ts-mockito"
import { generateDissolutionGetResponse } from "../fixtures/dissolutionApi.fixtures"
import { generateValidationError } from "../fixtures/error.fixtures"
import { generatePayByAccountDetailsForm } from "../fixtures/payment.fixtures"
import { generateDissolutionSession, TOKEN } from "../fixtures/session.fixtures"
import { createApp } from "./helpers/application.factory"
import HtmlAssertHelper from "./helpers/htmlAssert.helper"

import "app/controllers/payByAccountDetails.controller"
import ApplicationStatus from "app/models/dto/applicationStatus.enum"
import DissolutionSessionMapper from "app/mappers/session/dissolutionSession.mapper"
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse"
import PayByAccountDetailsFormModel from "app/models/form/payByAccountDetails.model"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import DissolutionConfirmation from "app/models/session/dissolutionConfirmation.model"
import ValidationErrors from "app/models/view/validationErrors.model"
import {
    PAY_BY_ACCOUNT_CHANGE_PAYMENT_TYPE_URI,
    PAY_BY_ACCOUNT_DETAILS_URI, SEARCH_COMPANY_URI, VIEW_FINAL_CONFIRMATION_URI
} from "app/paths"
import payByAccountDetailsSchema from "app/schemas/payByAccountDetails.schema"
import DissolutionService from "app/services/dissolution/dissolution.service"
import PayByAccountService from "app/services/payment/payByAccount.service"
import SessionService from "app/services/session/session.service"
import TYPES from "app/types"
import FormValidator from "app/utils/formValidator.util"
import { generateDissolutionConfirmation } from "test/fixtures/session.fixtures"
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock"
import PaymentService from "app/services/payment/payment.service"
import { ArgCaptor2 } from "ts-mockito/lib/capture/ArgCaptor"
import PaymentType from "app/models/dto/paymentType.enum"

mockCsrfMiddleware.restore()

describe("PayByAccountDetailsController", () => {

    const COMPANY_NUMBER = "ABC123"

    let sessionService: SessionService
    let dissolutionService: DissolutionService
    let validator: FormValidator
    let payByAccountService: PayByAccountService
    let paymentService: PaymentService
    let mapper: DissolutionSessionMapper
    let dissolutionSession: DissolutionSession = generateDissolutionSession()

    function initApp (): Application {
        return createApp(container => {
            container.rebind(SessionService).toConstantValue(instance(sessionService))
            container.rebind(DissolutionService).toConstantValue(instance(dissolutionService))
            container.rebind(FormValidator).toConstantValue(instance(validator))
            container.rebind(PayByAccountService).toConstantValue(instance(payByAccountService))
            container.rebind(DissolutionSessionMapper).toConstantValue(instance(mapper))
            container.rebind(PaymentService).toConstantValue(instance(paymentService))
        })
    }

    beforeEach(() => {
        sessionService = mock(SessionService)
        dissolutionService = mock(DissolutionService)
        validator = mock(FormValidator)
        payByAccountService = mock(PayByAccountService)
        paymentService = mock(PaymentService)
        mapper = mock(DissolutionSessionMapper)
        dissolutionSession = generateDissolutionSession()
        when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession)
    })

    describe("GET request", () => {
        let dissolutionSession: DissolutionSession
        let dissolutionGetResponse: DissolutionGetResponse

        beforeEach(() => {
            dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
            dissolutionGetResponse = generateDissolutionGetResponse()

            when(sessionService.getAccessToken(anything())).thenReturn(TOKEN)
            when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolutionGetResponse)
        })

        it("should reject with an error (if toggle is disabled)", async () => {
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

        it("should redirect to the search company page if the application has been paid for", async () => {
            dissolutionGetResponse.application_status = ApplicationStatus.PAID

            const app: Application = initApp()

            await request(app)
                .get(PAY_BY_ACCOUNT_DETAILS_URI)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", SEARCH_COMPANY_URI)
        })

        it("should render the pay by account details page (if toggle is enabled)", async () => {
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

            assert.isTrue(htmlAssertHelper.hasText("h1", "Enter your details to pay by account"))
        })

        it("should redirect to pay by card", async () => {
            const app: Application = initApp()
            const REDIRECT_CARD_URL = "http://card-payment-ui-url"
            when(paymentService.generatePaymentURL(TOKEN, anything(), anything())).thenResolve(REDIRECT_CARD_URL)

            await request(app)
                .get(PAY_BY_ACCOUNT_CHANGE_PAYMENT_TYPE_URI)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", REDIRECT_CARD_URL)

            const sessionCaptor: ArgCaptor2<Request, DissolutionSession> =
                capture<Request, DissolutionSession>(sessionService.setDissolutionSession)
            const updatedSession: DissolutionSession = sessionCaptor.last()[1]

            assert.equal(updatedSession.paymentType, PaymentType.CREDIT_DEBIT_CARD)
            assert.isDefined(updatedSession.paymentStateUUID)
        })

    })

    describe("POST request", () => {
        const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm()

        const dissolutionSession: DissolutionSession = generateDissolutionSession()

        it("should re-render the view with an error if validation fails", async () => {
            const error: ValidationErrors = generateValidationError("presenterId", "Some presenter ID error")

            when(validator.validate(deepEqual(form), payByAccountDetailsSchema)).thenReturn(error)

            const app: Application = initApp()

            const res = await request(app)
                .post(PAY_BY_ACCOUNT_DETAILS_URI)
                .send(form)
                .expect(StatusCodes.BAD_REQUEST)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.hasText("h1", "Enter your details to pay by account"))
            assert.isTrue(htmlAssertHelper.selectorExists(".govuk-error-summary"))
            assert.isTrue(htmlAssertHelper.containsText("#presenter-id-error", "Some presenter ID error"))
        })

        it("should re-render the view with an error if validation passes but account does not exist", async () => {
            when(validator.validate(deepEqual(form), payByAccountDetailsSchema)).thenReturn(null)
            when(payByAccountService.getAccountNumber(form)).thenResolve()

            const app: Application = initApp()

            const res = await request(app)
                .post(PAY_BY_ACCOUNT_DETAILS_URI)
                .send(form)
                .expect(StatusCodes.BAD_REQUEST)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.hasText("h1", "Enter your details to pay by account"))
            assert.isTrue(htmlAssertHelper.selectorExists(".govuk-error-summary"))
            assert.isTrue(htmlAssertHelper.containsText("#presenter-auth-code-error", "Your Presenter ID or Presenter authentication code is incorrect"))
        })

        it("should redirect to confirmation screen if validation passes and account exists", async () => {
            try {

                const dissolution: DissolutionGetResponse = generateDissolutionGetResponse()
                const confirmation: DissolutionConfirmation = generateDissolutionConfirmation()

                when(validator.validate(deepEqual(form), payByAccountDetailsSchema)).thenReturn(null)
                when(payByAccountService.getAccountNumber(deepEqual(form))).thenResolve("1234567890")
                when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)
                when(mapper.mapToDissolutionConfirmation(dissolution)).thenReturn(confirmation)

                const app: Application = initApp()

                await request(app)
                    .post(PAY_BY_ACCOUNT_DETAILS_URI)
                    .send(form)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", VIEW_FINAL_CONFIRMATION_URI)

            } catch (error) {
                console.error(error)
                throw error // Rethrow the error to make the test fail
            }
        })
    })
})
