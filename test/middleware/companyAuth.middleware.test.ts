import "reflect-metadata";

import { Session } from "@companieshouse/node-session-handler";
import { ISignInInfo } from "@companieshouse/node-session-handler/lib/session/model/SessionInterfaces";
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger";
import { assert } from "chai";
import { RequestHandler, Response } from "express";
import sinon from "sinon";
import { anything, instance, mock, when } from "ts-mockito";

import CompanyAuthMiddleware from "app/middleware/companyAuth.middleware";
import AuthConfig from "app/models/authConfig";
import DissolutionSession from "app/models/session/dissolutionSession.model";
import JwtEncryptionService from "app/services/encryption/jwtEncryption.service";
import SessionService from "app/services/session/session.service";

import { generateRequest } from "test/fixtures/http.fixtures";
import { generateDissolutionSession, generateSession } from "test/fixtures/session.fixtures";

describe("AuthMiddleware", () => {

    let middleware: RequestHandler;

    let encryptionService: JwtEncryptionService;
    let sessionService: SessionService;
    let logger: ApplicationLogger;
    let authConfig: AuthConfig;
    let session: Session;

    beforeEach(() => {
        encryptionService = mock(JwtEncryptionService);
        sessionService = mock(SessionService);
        logger = mock(ApplicationLogger);
        session = generateSession();

        when(sessionService.getSession(anything())).thenReturn(session);

        authConfig = {
            chsUrl: "http://chs-dev",
            accountClientId: "123456.gov.uk",
            accountRequestKey: "pXf+qkU6P6SAoY2lKW0FtKMS4PylaNA3pY2sUQxNFDk=",
            accountUrl: "http://account.chs-dev"
        };

        middleware = CompanyAuthMiddleware(
            authConfig, encryptionService, instance(sessionService), logger
        );
    });

    it("should throw an error if no company number is present", () => {
        const req = generateRequest();
        const res = {} as Response;
        const next = sinon.stub();

        middleware(req, res, next);

        const nextError = next.args[0][0];

        assert.equal(nextError.message, "No Company Number in session");

    });

    it("should invoke next() function if user is authenticated for company number", () => {
        const signInInfo: ISignInInfo = {
            company_number: "12345678"
        };
        const dissolutionSession: DissolutionSession = generateDissolutionSession();

        const req = generateRequest();

        const res = {} as Response;
        const next = sinon.stub().withArgs();

        when(sessionService.getDissolutionSession(req)).thenReturn(dissolutionSession);
        when(sessionService.getSignInInfo(req)).thenReturn(signInInfo);

        middleware(req, res, next);

        assert.isTrue(next.calledOnce);
    });

    it("should redirect if user is not authenticated for company number", async () => {
        const signInInfo: ISignInInfo = {
            company_number: "false_number"
        };
        const dissolutionSession: DissolutionSession = generateDissolutionSession();

        const req = generateRequest();

        const res = {} as Response;
        const redirectStub: sinon.SinonStub = sinon.stub();
        res.redirect = redirectStub;

        const next = sinon.stub();

        when(sessionService.getDissolutionSession(req)).thenReturn(dissolutionSession);
        when(sessionService.getSignInInfo(req)).thenReturn(signInInfo);

        await middleware(req, res, next);
        assert.isTrue(redirectStub.calledOnce);

        const redirectUrl: string = redirectStub.args[0][0];

        assert.include(redirectUrl, "http://account.chs-dev/oauth2/authorise?client_id=123456.gov.uk&redirect_uri=http://chs-dev/oauth2/user/callback&response_type=code&scope=https://account.companieshouse.gov.uk/user.write-full https://api.companieshouse.gov.uk/company/12345678");
    });
});
