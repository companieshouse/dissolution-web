import "reflect-metadata";

import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger";
import { assert } from "chai";
import { Request, RequestHandler, Response } from "express";
import sinon from "sinon";
import { anything, instance, mock, verify, when } from "ts-mockito";

import TransactionMiddleware from "app/middleware/transaction.middleware";
import DissolutionSession from "app/models/session/dissolutionSession.model";
import SessionService from "app/services/session/session.service";
import TransactionService from "app/services/transaction/transaction.service";

import { aDissolutionSession } from "test/fixtures/dissolutionSession.builder";
import { aTransaction } from "test/fixtures/transaction.builder";

describe("TransactionMiddleware", () => {
    let middleware: RequestHandler;
    let transactionService: TransactionService;
    let sessionService: SessionService;
    let logger: ApplicationLogger;

    const TOKEN = "some-access-token";
    const COMPANY_NUMBER = "12345678";
    const SESSION_TRANSACTION_ID = "111111-111111-111111";
    const OTHER_TRANSACTION_ID = "222222-222222-222222";
    const res = {} as Response;

    const aSessionWith = (transactionId?: string, companyNumber: string = COMPANY_NUMBER): DissolutionSession =>
        ({
            ...aDissolutionSession().withCompanyNumber(companyNumber).build(),
            transactionId,
        }) as DissolutionSession;

    beforeEach(() => {
        transactionService = mock(TransactionService);
        sessionService = mock(SessionService);
        logger = mock(ApplicationLogger);

        when(sessionService.getAccessToken(anything())).thenReturn(TOKEN);
        when(sessionService.getDissolutionSession(anything())).thenReturn(aSessionWith(SESSION_TRANSACTION_ID));

        middleware = TransactionMiddleware(instance(transactionService), instance(sessionService), instance(logger));
    });

    it("when transactionId is missing from params then next called and checks are skipped", () => {
        const req = { params: {} } as any as Request;
        const next = sinon.stub();

        middleware(req, res, next);

        assert.isTrue(next.calledOnce);
        assert.isUndefined(next.args[0][0]);
        verify(sessionService.getDissolutionSession(anything())).never();
        verify(transactionService.getTransaction(anything(), anything())).never();
    });

    ["invalid", "123456-123456", "12345-123456-123456", "abcdef-123456-123456", "123456-123456-123456-123456"].forEach(
        transactionId => {
            it(`when transactionId is invalid (${transactionId}) then next called WITH error`, () => {
                const req = { params: { transactionId } } as any as Request;
                const next = sinon.stub();

                middleware(req, res, next);

                assert.isTrue(next.calledOnce);
                const err = next.args[0][0];
                assert.instanceOf(err, Error);
                assert.equal(err.message, "Invalid transaction ID in path");
                verify(sessionService.getDissolutionSession(anything())).never();
            });
        }
    );

    it("when no dissolution session exists then next called WITH error", () => {
        const req = { params: { transactionId: SESSION_TRANSACTION_ID } } as any as Request;
        const next = sinon.stub();

        when(sessionService.getDissolutionSession(anything())).thenReturn(undefined);

        middleware(req, res, next);

        assert.isTrue(next.calledOnce);
        const err = next.args[0][0];
        assert.instanceOf(err, Error);
        assert.equal(err.message, "No transactionId in session");
    });

    it("when no transactionId in session then next called WITH error", () => {
        const req = { params: { transactionId: SESSION_TRANSACTION_ID } } as any as Request;
        const next = sinon.stub();

        when(sessionService.getDissolutionSession(anything())).thenReturn(aSessionWith(undefined));

        middleware(req, res, next);

        assert.isTrue(next.calledOnce);
        const err = next.args[0][0];
        assert.instanceOf(err, Error);
        assert.equal(err.message, "No transactionId in session");
    });

    it("when transactionId matches session transactionId then next called and transaction is not fetched", () => {
        const req = { params: { transactionId: SESSION_TRANSACTION_ID } } as any as Request;
        const next = sinon.stub();

        middleware(req, res, next);

        assert.isTrue(next.calledOnce);
        assert.isUndefined(next.args[0][0]);
        verify(transactionService.getTransaction(anything(), anything())).never();
    });

    it("when transactionId has surrounding whitespace and matches session then next called and transaction is not fetched", () => {
        const req = { params: { transactionId: `  ${SESSION_TRANSACTION_ID}  ` } } as any as Request;
        const next = sinon.stub();

        middleware(req, res, next);

        assert.isTrue(next.calledOnce);
        assert.isUndefined(next.args[0][0]);
        verify(transactionService.getTransaction(anything(), anything())).never();
    });

    it("when transactionId differs from session and transaction company matches session company then next called WITHOUT error", async () => {
        const req = { params: { transactionId: OTHER_TRANSACTION_ID } } as any as Request;
        const next = sinon.stub();

        when(transactionService.getTransaction(TOKEN, OTHER_TRANSACTION_ID)).thenResolve(
            aTransaction().withId(OTHER_TRANSACTION_ID).withCompanyNumber(COMPANY_NUMBER).build()
        );

        await middleware(req, res, next);

        verify(transactionService.getTransaction(TOKEN, OTHER_TRANSACTION_ID)).once();
        assert.isTrue(next.calledOnce);
        assert.isUndefined(next.args[0][0]);
    });

    it("when transactionId differs from session and transaction company does NOT match session company then next called WITH error", async () => {
        const req = { params: { transactionId: OTHER_TRANSACTION_ID } } as any as Request;
        const next = sinon.stub();

        when(transactionService.getTransaction(TOKEN, OTHER_TRANSACTION_ID)).thenResolve(
            aTransaction().withId(OTHER_TRANSACTION_ID).withCompanyNumber("87654321").build()
        );

        await middleware(req, res, next);

        assert.isTrue(next.calledOnce);
        const err = next.args[0][0];
        assert.instanceOf(err, Error);
        assert.equal(err.message, "Transaction company number does not match session company number");
    });

    it("when transactionId differs from session and fetching the transaction fails then next called WITH error", async () => {
        const req = { params: { transactionId: OTHER_TRANSACTION_ID } } as any as Request;
        const next = sinon.stub();
        const error = new Error(`Failed to get transaction for transaction id ${OTHER_TRANSACTION_ID}`);

        when(transactionService.getTransaction(TOKEN, OTHER_TRANSACTION_ID)).thenReject(error);

        await middleware(req, res, next);

        assert.isTrue(next.calledOnce);
        assert.equal(next.args[0][0], error);
    });
});
