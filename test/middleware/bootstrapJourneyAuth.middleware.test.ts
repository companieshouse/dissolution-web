import "reflect-metadata";

import { AuthOptions } from "@companieshouse/web-security-node";
import { assert } from "chai";
import { RequestHandler, Response } from "express";
import sinon from "sinon";
import { anything, instance, mock, verify, when } from "ts-mockito";

import BootstrapJourneyAuthMiddleware from "app/middleware/bootstrapJourneyAuth.middleware";
import { BOOTSTRAP_JOURNEY_URI } from "app/paths";
import CompanyAuthService from "app/services/auth/companyAuth.service";

const COMPANY_NUMBER = "12345678";
const AUTH_OPTIONS: AuthOptions = {
    chsWebUrl: "http://chs.test",
    returnUrl: `http://dissolution.test${BOOTSTRAP_JOURNEY_URI}?companyNumber=${COMPANY_NUMBER}`,
    companyNumber: COMPANY_NUMBER,
};

describe("BootstrapJourneyAuthMiddleware", () => {
    let middleware: RequestHandler;
    let companyAuthService: CompanyAuthService;
    let commonAuthStub: sinon.SinonStub;
    let authHandlerStub: sinon.SinonStub;
    let res: Response;
    let next: sinon.SinonStub;

    beforeEach(() => {
        companyAuthService = mock(CompanyAuthService);
        authHandlerStub = sinon.stub();
        commonAuthStub = sinon.stub().returns(authHandlerStub);
        res = {} as Response;
        next = sinon.stub();

        when(companyAuthService.isAuthorisedForCompany(anything(), anything())).thenReturn(false);
        when(companyAuthService.configureAuthRedirect(anything(), anything())).thenReturn(AUTH_OPTIONS);

        middleware = BootstrapJourneyAuthMiddleware(instance(companyAuthService), commonAuthStub);
    });

    const invalidCompanyNumbers: { description: string; query: any }[] = [
        { description: "missing", query: {} },
        { description: "empty", query: { companyNumber: "" } },
        { description: "non-alphanumeric", query: { companyNumber: "1234-678" } },
        { description: "longer than 8 characters", query: { companyNumber: "123456789" } },
        { description: "an array whose first value is invalid", query: { companyNumber: ["bad!", COMPANY_NUMBER] } },
    ];

    invalidCompanyNumbers.forEach(({ description, query }) => {
        it(`when company number is ${description} then next called WITH error and auth is not checked`, () => {
            middleware({ query } as any, res, next);

            assert.isTrue(next.calledOnce);
            const err = next.args[0][0];
            assert.instanceOf(err, Error);
            assert.equal(err.message, "Invalid company number");
            verify(companyAuthService.isAuthorisedForCompany(anything(), anything())).never();
            verify(companyAuthService.configureAuthRedirect(anything(), anything())).never();
            assert.isTrue(commonAuthStub.notCalled);
        });
    });

    it("when user is authorised for company then next called WITHOUT error and no redirect", () => {
        const req = { query: { companyNumber: COMPANY_NUMBER } } as any;
        when(companyAuthService.isAuthorisedForCompany(req, COMPANY_NUMBER)).thenReturn(true);

        middleware(req, res, next);

        assert.isTrue(next.calledOnceWithExactly());
        verify(companyAuthService.isAuthorisedForCompany(req, COMPANY_NUMBER)).once();
        verify(companyAuthService.configureAuthRedirect(anything(), anything())).never();
        assert.isTrue(commonAuthStub.notCalled);
    });

    it("when user is NOT authorised then delegates to common auth middleware with configured redirect", () => {
        const req = { query: { companyNumber: COMPANY_NUMBER } } as any;

        middleware(req, res, next);

        verify(companyAuthService.configureAuthRedirect(req, COMPANY_NUMBER)).once();
        assert.isTrue(commonAuthStub.calledOnceWithExactly(AUTH_OPTIONS));
        assert.isTrue(authHandlerStub.calledOnceWithExactly(req, res, next));
        assert.isTrue(next.notCalled);
    });

    it("when company number query param is repeated then the first value is used", () => {
        const req = { query: { companyNumber: [COMPANY_NUMBER, "87654321"] } } as any;
        when(companyAuthService.isAuthorisedForCompany(req, COMPANY_NUMBER)).thenReturn(true);

        middleware(req, res, next);

        verify(companyAuthService.isAuthorisedForCompany(req, COMPANY_NUMBER)).once();
        assert.isTrue(next.calledOnceWithExactly());
    });

    it("when company number has a prefix then it is passed through unchanged", () => {
        const req = { query: { companyNumber: "NI123456" } } as any;

        middleware(req, res, next);

        verify(companyAuthService.isAuthorisedForCompany(req, "NI123456")).once();
        verify(companyAuthService.configureAuthRedirect(req, "NI123456")).once();
    });
});
