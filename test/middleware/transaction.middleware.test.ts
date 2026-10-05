import "reflect-metadata";

import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger";
import { assert } from "chai";
import { Request, RequestHandler, Response } from "express";
import sinon from "sinon";
import { anything, instance, mock, verify, when } from "ts-mockito";

import TransactionMiddleware from "app/middleware/transaction.middleware";
import { BOOTSTRAP_JOURNEY_URI } from "app/paths";
import SessionService from "app/services/session/session.service";

describe("TransactionMiddleware", () => {
    let middleware: RequestHandler;
    let sessionService: SessionService;
    let logger: ApplicationLogger;
    let res: Response;
    let redirect: sinon.SinonStub;
    let next: sinon.SinonStub;

    const COMPANY_NUMBER = "12345678";
    const SESSION_TRANSACTION_ID = "111111-111111-111111";
    const OTHER_TRANSACTION_ID = "222222-222222-222222";

    const aRequestWith = (params: Record<string, string>): Request => ({ params }) as any as Request;

    const assertNextCalledWithoutError = (): void => {
        assert.isTrue(next.calledOnce);
        assert.isUndefined(next.args[0][0]);
    };

    const assertNextCalledWithError = (message: string): void => {
        assert.isTrue(next.calledOnce);
        const err = next.args[0][0];
        assert.instanceOf(err, Error);
        assert.equal(err.message, message);
    };

    beforeEach(() => {
        sessionService = mock(SessionService);
        logger = mock(ApplicationLogger);
        redirect = sinon.stub();
        res = { redirect } as any as Response;
        next = sinon.stub();

        when(sessionService.requireDissolutionCompanyNumber(anything())).thenReturn(COMPANY_NUMBER);
        when(sessionService.requireDissolutionTransactionId(anything())).thenReturn(SESSION_TRANSACTION_ID);

        middleware = TransactionMiddleware(instance(sessionService), instance(logger));
    });

    describe("when transactionId is not present in path", () => {
        const tests: Record<string, string>[] = [{}, { transactionId: "" }];
        tests.forEach(params => {
            it(`should call next and skip checks for params ${JSON.stringify(params)}`, () => {
                middleware(aRequestWith(params), res, next);

                assertNextCalledWithoutError();
                assert.isTrue(redirect.notCalled);
                verify(sessionService.requireDissolutionCompanyNumber(anything())).never();
                verify(sessionService.requireDissolutionTransactionId(anything())).never();
            });
        });
    });

    describe("when transactionId in path is invalid", () => {
        [
            "invalid",
            "   ",
            "123456-123456",
            "12345-123456-123456",
            "abcdef-123456-123456",
            "123456-123456-123456-123456",
        ].forEach(transactionId => {
            it(`should call next WITH error for "${transactionId}" without reading the session`, () => {
                middleware(aRequestWith({ transactionId }), res, next);

                assertNextCalledWithError("Invalid transaction ID in path");
                assert.isTrue(redirect.notCalled);
                verify(sessionService.requireDissolutionCompanyNumber(anything())).never();
                verify(sessionService.requireDissolutionTransactionId(anything())).never();
            });
        });
    });

    describe("when session data is missing", () => {
        it("should call next WITH error when there is no company number in session", () => {
            when(sessionService.requireDissolutionCompanyNumber(anything())).thenThrow(
                new Error("No company number in dissolution session")
            );

            middleware(aRequestWith({ transactionId: SESSION_TRANSACTION_ID }), res, next);

            assertNextCalledWithError("No company number in dissolution session");
            assert.isTrue(redirect.notCalled);
        });

        it("should call next WITH error when there is no transaction ID in session", () => {
            when(sessionService.requireDissolutionTransactionId(anything())).thenThrow(
                new Error("No transaction ID in dissolution session")
            );

            middleware(aRequestWith({ transactionId: SESSION_TRANSACTION_ID }), res, next);

            assertNextCalledWithError("No transaction ID in dissolution session");
            assert.isTrue(redirect.notCalled);
        });
    });

    describe("when transactionId in path matches session", () => {
        it("should call next without redirecting or logging", () => {
            middleware(aRequestWith({ transactionId: SESSION_TRANSACTION_ID }), res, next);

            assertNextCalledWithoutError();
            assert.isTrue(redirect.notCalled);
        });

        it("should call next when transactionId has surrounding whitespace", () => {
            middleware(aRequestWith({ transactionId: `  ${SESSION_TRANSACTION_ID}  ` }), res, next);

            assertNextCalledWithoutError();
            assert.isTrue(redirect.notCalled);
        });
    });

    describe("when transactionId in path does not match session", () => {
        it("should redirect to the bootstrap journey with the session company number and not call next", () => {
            middleware(aRequestWith({ transactionId: OTHER_TRANSACTION_ID }), res, next);

            assert.isTrue(redirect.calledOnceWithExactly(`${BOOTSTRAP_JOURNEY_URI}?companyNumber=${COMPANY_NUMBER}`));
            assert.isTrue(next.notCalled);
        });

        it("should URL-encode the company number in the redirect URI", () => {
            when(sessionService.requireDissolutionCompanyNumber(anything())).thenReturn("SC/12 34&5");

            middleware(aRequestWith({ transactionId: OTHER_TRANSACTION_ID }), res, next);

            assert.isTrue(redirect.calledOnceWithExactly(`${BOOTSTRAP_JOURNEY_URI}?companyNumber=SC%2F12%2034%265`));
            assert.isTrue(next.notCalled);
        });
    });
});
