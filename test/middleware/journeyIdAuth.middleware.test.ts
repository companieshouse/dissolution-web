import { Request, Response } from "express";
import { anything, instance, mock, when } from "ts-mockito";
import sinon from "sinon";
import { assert } from "chai";
import JourneyIdAuthMiddleware from "app/middleware/journeyIdAuth.middleware";
import SessionService from "app/services/session/session.service";
import { aDissolutionSession } from "test/fixtures/dissolutionSession.builder";

describe("JourneyIdAuthMiddleware", () => {
    const COMPANY_NUMBER = "12345678";
    const JOURNEY_ID = "e1101f0a-5121-4429-acee-a817c5cAAAAA";
    let sessionServiceMock: SessionService;
    let sessionService: SessionService;
    let middleware: ReturnType<typeof JourneyIdAuthMiddleware>;

    beforeEach(() => {
        sessionServiceMock = mock(SessionService);
        sessionService = instance(sessionServiceMock);
        middleware = JourneyIdAuthMiddleware(sessionService);
    });

    it("when param journeyId does NOT match session param then next called WITH error", () => {
        const req = { params: { journeyId: JOURNEY_ID, companyNumber: COMPANY_NUMBER } } as any as Request;
        const res = {} as Response;
        const next = sinon.stub();

        when(sessionServiceMock.getDissolutionSession(anything())).thenReturn(
            aDissolutionSession()
                .withJourneyId("e1101f0a-5121-4429-acee-a817c5cBBBBB")
                .withCompanyNumber(COMPANY_NUMBER)
                .build()
        );

        middleware(req, res, next);

        const nextError = next.args[0][0];
        assert.isTrue(next.calledOnce);
        assert.isDefined(nextError);
        assert.equal(nextError.message, "Journey expired - You can only file a dissolution for one company at a time");
    });

    it("when param journeyId DOES match session param then next called WITHOUT no error", () => {
        const req = { params: { journeyId: JOURNEY_ID, companyNumber: COMPANY_NUMBER } } as any as Request;
        const res = {} as Response;
        const next = sinon.stub();

        when(sessionServiceMock.getDissolutionSession(anything())).thenReturn(
            aDissolutionSession().withJourneyId(JOURNEY_ID).withCompanyNumber(COMPANY_NUMBER).build()
        );

        middleware(req, res, next);

        assert.isTrue(next.calledOnce);
        assert.isUndefined(next.args[0][0]);
    });

    it("when param journeyId is not present then next called WITH error", () => {
        const req = { params: { companyNumber: COMPANY_NUMBER } } as any as Request;
        const res = {} as Response;
        when(sessionServiceMock.getDissolutionSession(anything())).thenReturn(
            aDissolutionSession().withJourneyId("abc").withCompanyNumber(COMPANY_NUMBER).build()
        );

        const next = sinon.stub();
        middleware(req, res, next);

        const nextError = next.args[0][0];
        assert.isTrue(next.calledOnce);
        assert.isDefined(nextError);
        assert.equal(nextError.message, "No journeyId in request");
    });

    it("when no journeyId found in session then next called WITH error", () => {
        const req = { params: { journeyId: "abc", companyNumber: COMPANY_NUMBER } } as any as Request;
        const res = {} as Response;
        const next = sinon.stub();

        when(sessionServiceMock.getDissolutionSession(anything())).thenReturn(undefined);

        middleware(req, res, next);

        const nextError = next.args[0][0];
        assert.isTrue(next.calledOnce);
        assert.isDefined(nextError);
        assert.equal(nextError.message, "No journeyId in session");
    });

    it("when param companyNumber is not present then next called WITH error", () => {
        const req = { params: { journeyId: JOURNEY_ID } } as any as Request;
        const res = {} as Response;
        const next = sinon.stub();

        when(sessionServiceMock.getDissolutionSession(anything())).thenReturn(
            aDissolutionSession().withJourneyId(JOURNEY_ID).withCompanyNumber("12345678").build()
        );

        middleware(req, res, next);

        const nextError = next.args[0][0];
        assert.isTrue(next.calledOnce);
        assert.isDefined(nextError);
        assert.equal(nextError.message, "No companyNumber in request");
    });

    it("when param companyNumber does NOT match session companyNumber then next called WITH error", () => {
        const req = {
            params: {
                journeyId: JOURNEY_ID,
                companyNumber: "11111111",
            },
        } as any as Request;
        const res = {} as Response;
        const next = sinon.stub();

        when(sessionServiceMock.getDissolutionSession(anything())).thenReturn(
            aDissolutionSession().withJourneyId(JOURNEY_ID).withCompanyNumber("22222222").build()
        );

        middleware(req, res, next);

        const nextError = next.args[0][0];
        assert.isTrue(next.calledOnce);
        assert.isDefined(nextError);
        assert.equal(nextError.message, "Journey expired - You can only file a dissolution for one company at a time");
    });

    it("when param companyNumber DOES match session companyNumber and journeyId matches then next called WITHOUT error", () => {
        const req = {
            params: {
                journeyId: JOURNEY_ID,
                companyNumber: COMPANY_NUMBER,
            },
        } as any as Request;
        const res = {} as Response;
        const next = sinon.stub();

        when(sessionServiceMock.getDissolutionSession(anything())).thenReturn(
            aDissolutionSession().withJourneyId(JOURNEY_ID).withCompanyNumber("12345678").build()
        );

        middleware(req, res, next);

        assert.isTrue(next.calledOnce);
        assert.isUndefined(next.args[0][0]);
    });

    it("when no companyNumber found in session then next called WITH error", () => {
        const req = {
            params: {
                journeyId: JOURNEY_ID,
                companyNumber: COMPANY_NUMBER,
            },
        } as any as Request;
        const res = {} as Response;
        const next = sinon.stub();

        when(sessionServiceMock.getDissolutionSession(anything())).thenReturn(
            aDissolutionSession().withJourneyId(JOURNEY_ID).withCompanyNumber(undefined).build()
        );

        middleware(req, res, next);

        const nextError = next.args[0][0];
        assert.isTrue(next.calledOnce);
        assert.isDefined(nextError);
        assert.equal(nextError.message, "No companyNumber in session");
    });
});
