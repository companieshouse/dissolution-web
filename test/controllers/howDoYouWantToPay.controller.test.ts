import "reflect-metadata"

import { assert } from "chai"
import { Application, Request } from "express"
import { StatusCodes } from "http-status-codes"
import request from "supertest"
import { anything, capture, deepEqual, instance, mock, verify, when } from "ts-mockito"
import { ArgCaptor2 } from "ts-mockito/lib/capture/ArgCaptor"
import { generateValidationError } from "../fixtures/error.fixtures"
import { generateHowDoYouWantToPayForm } from "../fixtures/payment.fixtures"
import { generateDissolutionSession, TOKEN } from "../fixtures/session.fixtures"
import { createApp } from "./helpers/application.factory"
import HtmlAssertHelper from "./helpers/htmlAssert.helper"

import "app/controllers/howDoYouWantToPay.controller"
import ApplicationStatus from "app/models/dto/applicationStatus.enum"
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse"
import PaymentType from "app/models/dto/paymentType.enum"
import HowDoYouWantToPayForm from "app/models/form/howDoYouWantToPay.model"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import ValidationErrors from "app/models/view/validationErrors.model"
import { HOW_DO_YOU_WANT_TO_PAY_URI, PAY_BY_ACCOUNT_URI, SEARCH_COMPANY_URI } from "app/paths"
import DissolutionService from "app/services/dissolution/dissolution.service"
import PaymentService from "app/services/payment/payment.service"
import SessionService from "app/services/session/session.service"
import FormValidator from "app/utils/formValidator.util"

import { generateDissolutionGetResponse } from "test/fixtures/dissolutionApi.fixtures"

describe("HowDoYouWantToPayController", () => {

    let dissolutionService: DissolutionService
    let paymentService: PaymentService
    let sessionService: SessionService

    const COMPANY_NUMBER = "ABC123"
    const REDIRECT_CARD_URL = "http://card-payment-ui-url"

    let dissolution: DissolutionGetResponse
    let dissolutionSession: DissolutionSession
    let validator: FormValidator

    beforeEach(() => {
        dissolutionService = mock(DissolutionService)
        paymentService = mock(PaymentService)
        sessionService = mock(SessionService)

        dissolution = generateDissolutionGetResponse()
        dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
        validator = mock(FormValidator)

        when(sessionService.getAccessToken(anything())).thenReturn(TOKEN)
        when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession)
        when(paymentService.generatePaymentURL(TOKEN, anything(), anything())).thenResolve(REDIRECT_CARD_URL)
        when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)
    })

    function initApp (): Application {
        return createApp(container => {
            container.rebind(DissolutionService).toConstantValue(instance(dissolutionService))
            container.rebind(SessionService).toConstantValue(instance(sessionService))
            container.rebind(PaymentService).toConstantValue(instance(paymentService))
            container.rebind(FormValidator).toConstantValue(instance(validator))
        })
    }

    describe("GET", () => {

        it("should redirect to the search company page if the application has been paid for", async () => {
            dissolution.application_status = ApplicationStatus.PAID

            const app = initApp()

            await request(app)
                .get(HOW_DO_YOU_WANT_TO_PAY_URI)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", SEARCH_COMPANY_URI)

            verify(sessionService.setDissolutionSession(anything(), anything())).never()
        })

        it("should display the how do you want to pay page if the application has not been paid for", async () => {
            dissolution.application_status = ApplicationStatus.PENDING_PAYMENT

            const app = initApp()

            const res = await request(app)
                .get(HOW_DO_YOU_WANT_TO_PAY_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.containsText("h1", "How do you want to pay for the application?"))
        })
    })

    describe("POST", () => {
        it("should display how do you want to pay page with validation error when no payment type is selected", async () => {
            const form: HowDoYouWantToPayForm = generateHowDoYouWantToPayForm()
            form.paymentType = "" as PaymentType

            const error: ValidationErrors = generateValidationError("paymentType", "Select how the payment will be made")

            dissolution.application_status = ApplicationStatus.PENDING_PAYMENT

            when(validator.validate(deepEqual(form), anything())).thenReturn(error)

            const app = initApp()

            const res = await request(app)
                .post(HOW_DO_YOU_WANT_TO_PAY_URI)
                .send(form)
                .expect(StatusCodes.BAD_REQUEST)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.containsText(".govuk-error-summary__body", "Select how the payment will be made"))
        })

        it("should redirect to the credit card payment page when the credit/debit card payment type is selected", async () => {
            const form: HowDoYouWantToPayForm = generateHowDoYouWantToPayForm()
            form.paymentType = PaymentType.CREDIT_DEBIT_CARD

            dissolution.application_status = ApplicationStatus.PENDING_PAYMENT

            const app = initApp()

            await request(app)
                .post(HOW_DO_YOU_WANT_TO_PAY_URI)
                .send(form)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", REDIRECT_CARD_URL)

            verify(sessionService.setDissolutionSession(anything(), anything())).once()

            const sessionCaptor: ArgCaptor2<Request, DissolutionSession> =
        capture<Request, DissolutionSession>(sessionService.setDissolutionSession)
            const updatedSession: DissolutionSession = sessionCaptor.last()[1]

            assert.equal(updatedSession.paymentType, PaymentType.CREDIT_DEBIT_CARD)
            assert.isDefined(updatedSession.paymentStateUUID)
        })

        it("should redirect to the account payment page when the account payment type is selected", async () => {
            const form: HowDoYouWantToPayForm = generateHowDoYouWantToPayForm()
            form.paymentType = PaymentType.ACCOUNT

            dissolution.application_status = ApplicationStatus.PENDING_PAYMENT

            const app = initApp()

            await request(app)
                .post(HOW_DO_YOU_WANT_TO_PAY_URI)
                .send(form)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", PAY_BY_ACCOUNT_URI)

            verify(sessionService.setDissolutionSession(anything(), anything())).once()

            const sessionCaptor: ArgCaptor2<Request, DissolutionSession> =
        capture<Request, DissolutionSession>(sessionService.setDissolutionSession)
            const updatedSession: DissolutionSession = sessionCaptor.last()[1]

            assert.equal(updatedSession.paymentType, PaymentType.ACCOUNT)
        })
    })
})
