import "reflect-metadata";

import { assert } from "chai";
import { Application } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { anything, instance, mock, verify, when } from "ts-mockito";
import { generatePaymentSummary } from "../fixtures/payment.fixtures";
import { generateDissolutionSession, TOKEN } from "../fixtures/session.fixtures";
import { createApp } from "./helpers/application.factory";
import HtmlAssertHelper from "./helpers/htmlAssert.helper";

import "app/controllers/paymentReview.controller";
import ApplicationStatus from "app/models/dto/applicationStatus.enum";
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse";
import DissolutionSession from "app/models/session/dissolutionSession.model";
import { HOW_DO_YOU_WANT_TO_PAY_URI, PAYMENT_REVIEW_URI, SEARCH_COMPANY_URI } from "app/paths";
import DissolutionService from "app/services/dissolution/dissolution.service";
import PaymentService from "app/services/payment/payment.service";
import SessionService from "app/services/session/session.service";
import TransactionService from "app/services/transaction/transaction.service";
import TYPES from "app/types";

import { generateDissolutionGetResponse } from "test/fixtures/dissolutionApi.fixtures";
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock";
import JourneyPathService from "app/services/session/journeyPath.service";

mockCsrfMiddleware.restore();

describe("PaymentReviewController", () => {
    let dissolutionService: DissolutionService;
    let sessionService: SessionService;
    let paymentService: PaymentService;
    let transactionService: TransactionService;

    const COMPANY_NUMBER = "ABC123";
    const REDIRECT_URL = "http://some-payment-ui-url";

    let dissolution: DissolutionGetResponse;
    let dissolutionSession: DissolutionSession;

    function initApp(payByAccountEnabled = 1, transactionsEnabled = true): Application {
        return createApp(container => {
            container.rebind(DissolutionService).toConstantValue(instance(dissolutionService));
            container.rebind(SessionService).toConstantValue(instance(sessionService));
            container.rebind(PaymentService).toConstantValue(instance(paymentService));
            container.rebind(TransactionService).toConstantValue(instance(transactionService));
            container.rebind(TYPES.FEATURE_FLAG_TRANSACTIONS_ENABLED).toConstantValue(transactionsEnabled);
            container.rebind(TYPES.PAY_BY_ACCOUNT_FEATURE_ENABLED).toConstantValue(payByAccountEnabled);
            container.rebind(JourneyPathService).toConstantValue({
                journeyPath: (_req: any, pathTemplate: string) => pathTemplate,
            } as any);
        });
    }

    beforeEach(() => {
        dissolutionService = mock(DissolutionService);
        sessionService = mock(SessionService);
        paymentService = mock(PaymentService);
        transactionService = mock(TransactionService);

        dissolution = generateDissolutionGetResponse();
        dissolutionSession = generateDissolutionSession(COMPANY_NUMBER);
    });

    describe("GET - ensure that the payment review page loads correctly", () => {
        it("should redirect to the search company page if the application has already been paid for", async () => {
            when(sessionService.getAccessToken(anything())).thenReturn(TOKEN);
            when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession);
            when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);

            dissolution.application_status = ApplicationStatus.PAID;

            const app = initApp();

            await request(app)
                .get(PAYMENT_REVIEW_URI)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", SEARCH_COMPANY_URI);

            verify(dissolutionService.getDissolutionPaymentSummary(anything())).never();
            verify(dissolutionService.getTransactionDissolutionPaymentSummary(anything(), anything())).never();
        });

        it("should redirect to the payment review page if the application has not been paid for", async () => {
            when(sessionService.getAccessToken(anything())).thenReturn(TOKEN);
            when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession);
            when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);
            dissolution.transaction_id = undefined;
            dissolutionSession.transactionId = "session-transaction-id";
            when(dissolutionService.getDissolutionPaymentSummary(dissolutionSession)).thenResolve(
                generatePaymentSummary()
            );

            dissolution.application_status = ApplicationStatus.PENDING_PAYMENT;

            const app = initApp();

            const res = await request(app).get(PAYMENT_REVIEW_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(htmlAssertHelper.hasText("h1", "Review your payment"));
            assert.isTrue(htmlAssertHelper.hasText("#item-0", "Some payment description"));
            assert.isTrue(htmlAssertHelper.hasText("#amount-to-pay-0", "£13.00"));
            assert.isTrue(htmlAssertHelper.hasText("#total_cost", "£26.00"));

            verify(dissolutionService.getDissolutionPaymentSummary(dissolutionSession)).once();
            verify(dissolutionService.getTransactionDissolutionPaymentSummary(anything(), anything())).never();
        });

        it("should use the transaction payment summary when the dissolution has a transaction ID", async () => {
            dissolution.transaction_id = "transaction-id";
            dissolution.application_status = ApplicationStatus.PENDING_PAYMENT;
            dissolutionSession.transactionId = undefined;
            when(sessionService.getAccessToken(anything())).thenReturn(TOKEN);
            when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession);
            when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);
            when(
                dissolutionService.getTransactionDissolutionPaymentSummary(
                    dissolution.company_number,
                    dissolution.company_name
                )
            ).thenReturn(generatePaymentSummary());

            const app = initApp();

            const res = await request(app).get(PAYMENT_REVIEW_URI).expect(StatusCodes.OK);
            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(htmlAssertHelper.hasText("#item-0", "Some payment description"));
            assert.isTrue(htmlAssertHelper.hasText("#amount-to-pay-0", "£13.00"));
            assert.isTrue(htmlAssertHelper.hasText("#total_cost", "£26.00"));
            verify(
                dissolutionService.getTransactionDissolutionPaymentSummary(
                    dissolution.company_number,
                    dissolution.company_name
                )
            ).once();
            verify(dissolutionService.getDissolutionPaymentSummary(anything())).never();
        });

        it("should prevent payment review when the dissolution cannot be retrieved", async () => {
            when(sessionService.getAccessToken(anything())).thenReturn(TOKEN);
            when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession);
            when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(null);

            const app = initApp();

            await request(app).get(PAYMENT_REVIEW_URI).expect(StatusCodes.INTERNAL_SERVER_ERROR);

            verify(dissolutionService.getDissolutionPaymentSummary(anything())).never();
            verify(dissolutionService.getTransactionDissolutionPaymentSummary(anything(), anything())).never();
        });
    });

    describe("POST - ensure that the payment review page submits successfully", () => {
        it("should prevent payment when the dissolution cannot be retrieved", async () => {
            when(sessionService.getAccessToken(anything())).thenReturn(TOKEN);
            when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession);
            when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(null);

            const app = initApp();

            await request(app).post(PAYMENT_REVIEW_URI).expect(StatusCodes.INTERNAL_SERVER_ERROR);

            verify(transactionService.closeTransaction(anything(), anything())).never();
            verify(paymentService.generatePaymentURL(anything(), anything(), anything(), anything())).never();
        });

        it("should redirect to the how do you want to pay page (if the pay by account feature toggle is on)", async () => {
            const app = initApp();

            when(sessionService.getAccessToken(anything())).thenReturn(TOKEN);
            when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession);
            when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);

            await request(app)
                .post(PAYMENT_REVIEW_URI)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", HOW_DO_YOU_WANT_TO_PAY_URI);
        });

        it("should redirect to the GOV.UK Pay journey (if the pay by account feature toggle is off)", async () => {
            when(sessionService.getAccessToken(anything())).thenReturn(TOKEN);
            when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession);
            when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);
            when(transactionService.closeTransaction(TOKEN, dissolutionSession.transactionId!)).thenResolve();
            when(paymentService.generatePaymentURL(TOKEN, dissolutionSession, anything(), anything())).thenResolve(
                REDIRECT_URL
            );

            const app = initApp(0);

            await request(app)
                .post(PAYMENT_REVIEW_URI)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", REDIRECT_URL);
        });

        it("should close transaction before creating payment URL when transactionId exists", async () => {
            const transactionId = "tx-123";
            const txSession: DissolutionSession = { ...dissolutionSession, transactionId };

            when(sessionService.getAccessToken(anything())).thenReturn(TOKEN);
            when(sessionService.getDissolutionSession(anything())).thenReturn(txSession);
            when(dissolutionService.getDissolution(TOKEN, txSession)).thenResolve(dissolution);
            when(transactionService.closeTransaction(TOKEN, transactionId)).thenResolve();
            when(paymentService.generatePaymentURL(TOKEN, txSession, anything(), anything())).thenResolve(REDIRECT_URL);

            const app = initApp(0);

            await request(app).post(PAYMENT_REVIEW_URI).expect(StatusCodes.MOVED_TEMPORARILY);

            verify(transactionService.closeTransaction(TOKEN, transactionId)).once();
            verify(transactionService.closeTransaction(TOKEN, transactionId)).calledBefore(
                paymentService.generatePaymentURL(TOKEN, txSession, anything(), anything())
            );
        });

        it("should allow payment without checking director signatures", async () => {
            when(sessionService.getAccessToken(anything())).thenReturn(TOKEN);
            when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession);
            when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);

            const app = initApp();

            await request(app)
                .post(PAYMENT_REVIEW_URI)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", HOW_DO_YOU_WANT_TO_PAY_URI);
        });

        for (const transactionsEnabled of [true, false]) {
            for (const payByAccountEnabled of [1, 0]) {
                for (const directorsToSign of [undefined, []]) {
                    it(`should allow returning applicants with ${directorsToSign ? "empty" : "missing"} session selection, transactions ${transactionsEnabled} and pay by account ${payByAccountEnabled}`, async () => {
                        dissolutionSession.directorsToSign = directorsToSign;
                        dissolutionSession.transactionId = transactionsEnabled ? "tx-123" : undefined;
                        when(sessionService.getAccessToken(anything())).thenReturn(TOKEN);
                        when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession);
                        when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);
                        when(transactionService.closeTransaction(TOKEN, "tx-123")).thenResolve();
                        when(
                            paymentService.generatePaymentURL(TOKEN, dissolutionSession, anything(), anything())
                        ).thenResolve(REDIRECT_URL);

                        const app = initApp(payByAccountEnabled, transactionsEnabled);

                        await request(app)
                            .post(PAYMENT_REVIEW_URI)
                            .expect(StatusCodes.MOVED_TEMPORARILY)
                            .expect("Location", payByAccountEnabled ? HOW_DO_YOU_WANT_TO_PAY_URI : REDIRECT_URL);

                        verify(transactionService.closeTransaction(anything(), anything())).times(
                            transactionsEnabled ? 1 : 0
                        );
                    });
                }
            }
        }

        it("should proceed to payment when no directors are persisted", async () => {
            dissolution.directors = [];
            when(sessionService.getAccessToken(anything())).thenReturn(TOKEN);
            when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession);
            when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);

            const app = initApp();

            await request(app)
                .post(PAYMENT_REVIEW_URI)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", HOW_DO_YOU_WANT_TO_PAY_URI);

            verify(transactionService.closeTransaction(anything(), anything())).never();
        });
    });
});
