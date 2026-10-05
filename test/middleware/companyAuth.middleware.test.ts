import "reflect-metadata";

import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger";
import { AuthOptions } from "@companieshouse/web-security-node";
import { assert } from "chai";
import { RequestHandler, Response } from "express";
import sinon from "sinon";
import { anything, instance, mock, verify, when } from "ts-mockito";

import CompanyAuthMiddleware, { isWhitelistedUrl } from "app/middleware/companyAuth.middleware";
import CompanyAuthService from "app/services/auth/companyAuth.service";
import SessionService from "app/services/session/session.service";
import {
    ACCESSIBILITY_STATEMENT_URI,
    BOOTSTRAP_JOURNEY_URI,
    CHECK_YOUR_ANSWERS_URI,
    DEFINE_SIGNATORY_INFO_URI,
    HEALTHCHECK_URI,
    ROOT_URI,
    SEARCH_COMPANY_URI,
    SELECT_DIRECTOR_URI,
    SELECT_SIGNATORIES_URI,
    STOP_SCREEN_BANK_ACCOUNT_URI,
    VIEW_COMPANY_INFORMATION_URI,
    WHO_TO_TELL_URI,
} from "app/paths";

const COMPANY_NUMBER = "12345678";
const AUTH_OPTIONS: AuthOptions = {
    chsWebUrl: "http://chs.test",
    returnUrl: `http://dissolution.test${BOOTSTRAP_JOURNEY_URI}?companyNumber=${COMPANY_NUMBER}`,
    companyNumber: COMPANY_NUMBER,
};

describe("CompanyAuthMiddleware", () => {
    let middleware: RequestHandler;
    let companyAuthService: CompanyAuthService;
    let sessionService: SessionService;
    let logger: ApplicationLogger;
    let commonAuthStub: sinon.SinonStub;
    let authHandlerStub: sinon.SinonStub;
    let res: Response;
    let next: sinon.SinonStub;

    beforeEach(() => {
        companyAuthService = mock(CompanyAuthService);
        sessionService = mock(SessionService);
        logger = mock(ApplicationLogger);
        authHandlerStub = sinon.stub();
        commonAuthStub = sinon.stub().returns(authHandlerStub);
        res = {} as Response;
        next = sinon.stub();

        when(companyAuthService.isAuthorisedForCompany(anything(), anything())).thenReturn(false);
        when(companyAuthService.configureAuthRedirect(anything(), anything())).thenReturn(AUTH_OPTIONS);

        middleware = CompanyAuthMiddleware(
            instance(companyAuthService),
            instance(sessionService),
            commonAuthStub,
            instance(logger)
        );
    });

    const whitelistedUrls = [
        ROOT_URI,
        `${ROOT_URI}/`,
        WHO_TO_TELL_URI,
        `${WHO_TO_TELL_URI}/`,
        HEALTHCHECK_URI,
        `${HEALTHCHECK_URI}/`,
        SEARCH_COMPANY_URI,
        `${SEARCH_COMPANY_URI}/`,
        STOP_SCREEN_BANK_ACCOUNT_URI,
        `${STOP_SCREEN_BANK_ACCOUNT_URI}/`,
        ACCESSIBILITY_STATEMENT_URI,
        `${ACCESSIBILITY_STATEMENT_URI}/`,
        BOOTSTRAP_JOURNEY_URI,
        `${BOOTSTRAP_JOURNEY_URI}/`,
    ];

    whitelistedUrls.forEach(url => {
        it(`whitelisted urls are ignored: ${url}`, () => {
            const req = { path: url } as any;

            middleware(req, res, next);

            assert.isTrue(isWhitelistedUrl(url));
            assert.isTrue(next.calledOnceWithExactly());
            verify(sessionService.getDissolutionCompanyNumber(anything())).never();
            assert.isTrue(commonAuthStub.notCalled);
        });
    });

    it("whitelist check uses req.path so query strings are ignored", () => {
        const req = { path: BOOTSTRAP_JOURNEY_URI, url: `${BOOTSTRAP_JOURNEY_URI}?companyNumber=1` } as any;

        middleware(req, res, next);

        assert.isTrue(next.calledOnceWithExactly());
        verify(sessionService.getDissolutionCompanyNumber(anything())).never();
    });

    const nonWhitelistedUrls = [
        VIEW_COMPANY_INFORMATION_URI.replace(":journeyId", "test-uuid"),
        SELECT_DIRECTOR_URI.replace(":journeyId", "test-uuid"),
        SELECT_SIGNATORIES_URI.replace(":journeyId", "test-uuid"),
        DEFINE_SIGNATORY_INFO_URI.replace(":journeyId", "test-uuid"),
        CHECK_YOUR_ANSWERS_URI.replace(":journeyId", "test-uuid"),
        `${CHECK_YOUR_ANSWERS_URI.replace(":journeyId", "test-uuid")}/subpath`,
        `${ROOT_URI}/not-whitelisted`,
        `${ROOT_URI}/abc/view-company-information/extra`,
        "/random-path",
        `${ROOT_URI}/abc%2Fview-company-information/extra`,
        `${BOOTSTRAP_JOURNEY_URI}/subpath`,
    ];

    nonWhitelistedUrls.forEach(path => {
        it(`non-whitelisted urls are processed: ${path}`, () => {
            const req = { path } as any;
            when(sessionService.getDissolutionCompanyNumber(req)).thenReturn(undefined);

            middleware(req, res, next);

            assert.isFalse(isWhitelistedUrl(path));
            verify(sessionService.getDissolutionCompanyNumber(req)).once();
        });
    });

    it("when no companyNumber is in session then next called WITH error and auth is not checked", () => {
        const req = { path: "/some-path" } as any;
        when(sessionService.getDissolutionCompanyNumber(req)).thenReturn(undefined);

        middleware(req, res, next);

        assert.isTrue(next.calledOnce);
        assert.instanceOf(next.args[0][0], Error);
        assert.equal(next.args[0][0].message, "No Company Number in session");
        verify(companyAuthService.isAuthorisedForCompany(anything(), anything())).never();
        assert.isTrue(commonAuthStub.notCalled);
    });

    it("when user is authorised for company then next called WITHOUT error and no redirect", () => {
        const req = { path: "/some-path" } as any;
        when(sessionService.getDissolutionCompanyNumber(req)).thenReturn(COMPANY_NUMBER);
        when(companyAuthService.isAuthorisedForCompany(req, COMPANY_NUMBER)).thenReturn(true);

        middleware(req, res, next);

        assert.isTrue(next.calledOnceWithExactly());
        verify(companyAuthService.isAuthorisedForCompany(req, COMPANY_NUMBER)).once();
        verify(companyAuthService.configureAuthRedirect(anything(), anything())).never();
        verify(logger.info(`Authenticated user is authorized for ${COMPANY_NUMBER}`)).once();
        assert.isTrue(commonAuthStub.notCalled);
    });

    it("when user is NOT authorised then delegates to common auth middleware with configured redirect", () => {
        const req = { path: "/some-path" } as any;
        when(sessionService.getDissolutionCompanyNumber(req)).thenReturn(COMPANY_NUMBER);

        middleware(req, res, next);

        verify(companyAuthService.configureAuthRedirect(req, COMPANY_NUMBER)).once();
        assert.isTrue(commonAuthStub.calledOnceWithExactly(AUTH_OPTIONS));
        assert.isTrue(authHandlerStub.calledOnceWithExactly(req, res, next));
        assert.isTrue(next.notCalled);
    });
});
