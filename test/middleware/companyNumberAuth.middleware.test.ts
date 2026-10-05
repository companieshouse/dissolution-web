import "reflect-metadata";

import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger";
import { AuthOptions } from "@companieshouse/web-security-node";
import { assert } from "chai";
import { RequestHandler, Response } from "express";
import sinon from "sinon";
import { anything, instance, mock, verify, when } from "ts-mockito";

import CompanyNumberAuthMiddleware from "app/middleware/companyNumberAuth.middleware";
import { BOOTSTRAP_JOURNEY_URI } from "app/paths";
import CompanyAuthService from "app/services/auth/companyAuth.service";

const COMPANY_NUMBER = "12345678";
const AUTH_OPTIONS: AuthOptions = {
    chsWebUrl: "http://chs.test",
    returnUrl: `http://dissolution.test${BOOTSTRAP_JOURNEY_URI}?companyNumber=${COMPANY_NUMBER}`,
    companyNumber: COMPANY_NUMBER,
};

const flushPromises = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

describe("CompanyNumberAuthMiddleware", () => {
    let middleware: RequestHandler;
    let companyAuthService: CompanyAuthService;
    let logger: ApplicationLogger;
    let commonAuthStub: sinon.SinonStub;
    let authHandlerStub: sinon.SinonStub;
    let res: Response;
    let next: sinon.SinonStub;

    beforeEach(() => {
        companyAuthService = mock(CompanyAuthService);
        logger = mock(ApplicationLogger);
        authHandlerStub = sinon.stub();
        commonAuthStub = sinon.stub().returns(authHandlerStub);
        res = {} as Response;
        next = sinon.stub();

        when(companyAuthService.isAuthorisedForCompany(anything(), anything())).thenReturn(false);
        when(companyAuthService.configureAuthRedirect(anything(), anything())).thenReturn(AUTH_OPTIONS);

        middleware = CompanyNumberAuthMiddleware(instance(companyAuthService), commonAuthStub, instance(logger));
    });

    const assertNextCalledWithError = (message: string): void => {
        assert.isTrue(next.calledOnce);
        const err = next.args[0][0];
        assert.instanceOf(err, Error);
        assert.equal(err.message, message);
    };

    const assertAuthNotChecked = (): void => {
        verify(companyAuthService.isAuthorisedForCompany(anything(), anything())).never();
        assert.isTrue(commonAuthStub.notCalled);
    };

    it("when company number is missing from params then next called WITH error", () => {
        middleware({ params: {} } as any, res, next);

        assertNextCalledWithError("No company number in path");
        assertAuthNotChecked();
    });

    ["invalid-123!", "123456789", "abc def"].forEach(companyNumber => {
        it(`when company number is invalid (${companyNumber}) then next called WITH error`, () => {
            middleware({ params: { companyNumber } } as any, res, next);

            assertNextCalledWithError("Invalid company number in path");
            assertAuthNotChecked();
        });
    });

    ["NI123456", "SC000001", "1"].forEach(companyNumber => {
        it(`when company number is valid (${companyNumber}) then auth is checked with that company number`, () => {
            const req = { params: { companyNumber } } as any;
            when(companyAuthService.isAuthorisedForCompany(req, companyNumber)).thenReturn(true);

            middleware(req, res, next);

            verify(companyAuthService.isAuthorisedForCompany(req, companyNumber)).once();
            assert.isTrue(next.calledOnceWithExactly());
        });
    });

    it("when user is authorised then next called WITHOUT error and no redirect", () => {
        const req = { params: { companyNumber: COMPANY_NUMBER } } as any;
        when(companyAuthService.isAuthorisedForCompany(req, COMPANY_NUMBER)).thenReturn(true);

        middleware(req, res, next);

        assert.isTrue(next.calledOnceWithExactly());
        verify(companyAuthService.configureAuthRedirect(anything(), anything())).never();
        verify(
            logger.info(`[CompanyNumberAuthMiddleware] Authenticated user is authorized for ${COMPANY_NUMBER}`)
        ).once();
        assert.isTrue(commonAuthStub.notCalled);
    });

    it("when user is NOT authorised then delegates to common auth middleware with configured redirect", () => {
        const req = { params: { companyNumber: COMPANY_NUMBER } } as any;

        middleware(req, res, next);

        verify(companyAuthService.configureAuthRedirect(req, COMPANY_NUMBER)).once();
        assert.isTrue(commonAuthStub.calledOnceWithExactly(AUTH_OPTIONS));
        assert.isTrue(authHandlerStub.calledOnceWithExactly(req, res, next));
        assert.isTrue(next.notCalled);
        verify(
            logger.info(
                `[CompanyNumberAuthMiddleware] Authenticated user is not authorized for ${COMPANY_NUMBER}, redirecting to Enter Company Auth Code page`
            )
        ).once();
    });

    it("when checking authorisation throws then next called WITH error", () => {
        const req = { params: { companyNumber: COMPANY_NUMBER } } as any;
        const error = new Error("no session");
        when(companyAuthService.isAuthorisedForCompany(anything(), anything())).thenThrow(error);

        middleware(req, res, next);

        assert.isTrue(next.calledOnceWithExactly(error));
        assert.isTrue(commonAuthStub.notCalled);
    });

    it("when configuring the auth redirect throws then next called WITH error", () => {
        const req = { params: { companyNumber: COMPANY_NUMBER } } as any;
        const error = new Error("bad config");
        when(companyAuthService.configureAuthRedirect(anything(), anything())).thenThrow(error);

        middleware(req, res, next);

        assert.isTrue(next.calledOnceWithExactly(error));
        assert.isTrue(commonAuthStub.notCalled);
    });

    it("when common auth middleware rejects then next called WITH error", async () => {
        const req = { params: { companyNumber: COMPANY_NUMBER } } as any;
        const error = new Error("auth failure");
        authHandlerStub.rejects(error);

        middleware(req, res, next);
        await flushPromises();

        assert.isTrue(next.calledOnceWithExactly(error));
    });
});
