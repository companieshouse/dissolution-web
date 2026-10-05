import "reflect-metadata";
import { assert } from "chai";
import sinon from "sinon";
import CompanyAuthService from "app/services/auth/companyAuth.service";
import UriFactory from "app/utils/uri.factory";
import { BOOTSTRAP_JOURNEY_URI } from "app/paths";
import SessionService from "app/services/session/session.service";
import AuthConfig from "app/models/authConfig";
import { Request } from "express";

describe("CompanyAuthService", () => {
    let sessionService: any;
    let authConfig: AuthConfig;
    let service: CompanyAuthService;
    let createAbsoluteUriStub: sinon.SinonStub;

    beforeEach(() => {
        createAbsoluteUriStub = sinon.stub().returns("http://dissolution.test/return");

        sessionService = {
            getSignInInfo: sinon.stub(),
            setCompanyAuthNonce: sinon.stub(),
        };

        authConfig = {
            chsUrl: "http://chs-dev",
            accountClientId: "client-id",
            accountRequestKey: "key",
            accountUrl: "http://account.chs-dev",
        };

        service = new CompanyAuthService(
            authConfig,
            sessionService as SessionService,
            { createAbsoluteUri: createAbsoluteUriStub } as UriFactory
        );
    });

    describe("isAuthorisedForCompany", () => {
        it("when signInInfo company number MATCHES provided company number then TRUE returned", () => {
            const req = {} as Request;
            sessionService.getSignInInfo.withArgs(req).returns({ company_number: "123" });

            const result = service.isAuthorisedForCompany(req, "123");
            assert.isTrue(result);
        });

        it("when signInInfo company number does NOT MATCH provided company number then FALSE returned", () => {
            const req = {} as Request;
            sessionService.getSignInInfo.withArgs(req).returns({ company_number: "999" });

            assert.isFalse(service.isAuthorisedForCompany(req, "123"));
        });

        it("when provided company number is missing then FALSE returned", () => {
            const req = {} as Request;
            sessionService.getSignInInfo.withArgs(req).returns({ company_number: "999" });

            assert.isFalse(service.isAuthorisedForCompany(req, undefined));
        });
    });

    describe("configureAuthRedirect", () => {
        it("returns auth options with chs url, absolute bootstrap return url and company number", () => {
            const req = {} as Request;

            const result = service.configureAuthRedirect(req, "12345678");

            assert.deepEqual(result, {
                chsWebUrl: "http://chs-dev",
                returnUrl: "http://dissolution.test/return",
                companyNumber: "12345678",
            });
            sinon.assert.calledOnceWithExactly(
                createAbsoluteUriStub,
                req,
                `${BOOTSTRAP_JOURNEY_URI}?companyNumber=12345678`
            );
        });

        it("URI-encodes the company number in the return url", () => {
            const req = {} as Request;

            service.configureAuthRedirect(req, "NI 12/34");

            sinon.assert.calledWith(createAbsoluteUriStub, req, `${BOOTSTRAP_JOURNEY_URI}?companyNumber=NI%2012%2F34`);
        });
    });
});
