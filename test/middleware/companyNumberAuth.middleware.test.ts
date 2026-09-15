import "reflect-metadata";

import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger";
import { assert } from "chai";
import { RequestHandler, Response } from "express";
import sinon from "sinon";
import { anything, instance, mock, when } from "ts-mockito";

import CompanyNumberAuthMiddleware from "app/middleware/companyNumberAuth.middleware";
import CompanyAuthService from "app/services/auth/companyAuth.service";

describe("CompanyNumberAuthMiddleware", () => {
    let middleware: RequestHandler;
    let companyAuthService: CompanyAuthService;
    let logger: ApplicationLogger;

    const COMPANY_NUMBER = "12345678";
    const res = {} as Response;

    beforeEach(() => {
        companyAuthService = mock(CompanyAuthService);
        logger = mock(ApplicationLogger);

        when(companyAuthService.isAuthorisedForCompany(anything(), anything())).thenReturn(false);
        when(companyAuthService.issueAuthRedirectUri(anything(), anything())).thenResolve(
            "http://account.chs-dev/oauth2/authorise?client_id=123456"
        );

        middleware = CompanyNumberAuthMiddleware(instance(companyAuthService), logger);
    });

    it("when company number is missing from params then next called WITH error", () => {
        const req = { params: {} } as any;
        const next = sinon.stub();

        middleware(req, res, next);

        assert.isTrue(next.calledOnce);
        const err = next.args[0][0];
        assert.instanceOf(err, Error);
        assert.equal(err.message, "No company Number in path");
    });

    it("when company number is invalid then throws error", () => {
        const req = { params: { companyNumber: "invalid-123!" } } as any;
        const next = sinon.stub();

        middleware(req, res, next);

        assert.isTrue(next.calledOnce, `next should be called for non-whitelisted url: ${req.path}`);
        const err = next.args[0][0];
        assert.instanceOf(err, Error);
        assert.equal(err.message, "Invalid company number in path");
    });

    it("when company number exceeds 8 characters then throws error", () => {
        const req = { params: { companyNumber: "123456789" } } as any;
        const next = sinon.stub();

        middleware(req, res, next);

        assert.isTrue(next.calledOnce, `next should be called for non-whitelisted url: ${req.path}`);
        const err = next.args[0][0];
        assert.instanceOf(err, Error);
        assert.equal(err.message, "Invalid company number in path");
    });

    it("when company number is valid and user is authorized then next called WITHOUT error", () => {
        const req = { params: { companyNumber: COMPANY_NUMBER } } as any;
        const next = sinon.stub();

        when(companyAuthService.isAuthorisedForCompany(anything(), anything())).thenReturn(true);

        middleware(req, res, next);

        assert.isTrue(next.calledOnce);
        assert.isUndefined(next.args[0][0]);
    });

    it("when company number is valid but user is NOT authorized then redirects to auth code page", async () => {
        const req = { params: { companyNumber: COMPANY_NUMBER } } as any;
        const redirectStub: sinon.SinonStub = sinon.stub();
        res.redirect = redirectStub;
        const next = sinon.stub();

        when(companyAuthService.isAuthorisedForCompany(anything(), anything())).thenReturn(false);
        when(companyAuthService.issueAuthRedirectUri(anything(), anything())).thenResolve(
            "http://account.chs-dev/oauth2/authorise?client_id=123456.gov.uk&redirect_uri=http://chs-dev/oauth2/user/callback&response_type=code&scope=https://account.companieshouse.gov.uk/user.write-full https://api.companieshouse.gov.uk/company/12345678"
        );

        await middleware(req, res, next);

        assert.isTrue(redirectStub.calledOnce);
        const redirectUrl: string = redirectStub.args[0][0];
        assert.equal(
            redirectUrl,
            "http://account.chs-dev/oauth2/authorise?client_id=123456.gov.uk&redirect_uri=http://chs-dev/oauth2/user/callback&response_type=code&scope=https://account.companieshouse.gov.uk/user.write-full https://api.companieshouse.gov.uk/company/12345678"
        );
    });

    it("when company number is valid and has uppercase characters then validates correctly", () => {
        const req = { params: { companyNumber: "NI123456" } } as any;
        const next = sinon.stub();

        when(companyAuthService.isAuthorisedForCompany(anything(), anything())).thenReturn(true);

        middleware(req, res, next);

        assert.isTrue(next.calledOnce);
        assert.isUndefined(next.args[0][0]);
    });
});
