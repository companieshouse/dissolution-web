import { assert } from "chai";
import { anything, instance, mock, when } from "ts-mockito";
import { generateRequest } from "test/fixtures/http.fixtures";
import { Request } from "express";
import JourneyPathService from "app/services/session/journeyPath.service";
import SessionService from "app/services/session/session.service";

describe("JourneyPathService", () => {
    let journeyPathService: JourneyPathService;
    let sessionServiceMock: SessionService;
    let sessionService: SessionService;

    beforeEach(() => {
        sessionServiceMock = mock(SessionService);
        sessionService = instance(sessionServiceMock);
        journeyPathService = new JourneyPathService(sessionService);
    });

    describe("journeyPath", () => {
        it("should build path with journeyId and companyNumber from session when not provided", () => {
            const req: Request = generateRequest();
            const journeyId = "e1101f0a-5121-4429-acee-a817c5cAAAAA";
            const companyNumber = "12345678";
            const pathTemplate = "/close-a-company/:journeyId/company/:companyNumber/view-company-information";

            when(sessionServiceMock.requireJourneyId(anything())).thenReturn(journeyId);
            when(sessionServiceMock.requireDissolutionCompanyNumber(anything())).thenReturn(companyNumber);

            const result = journeyPathService.journeyPath(req, pathTemplate);

            assert.equal(
                result,
                "/close-a-company/e1101f0a-5121-4429-acee-a817c5cAAAAA/company/12345678/view-company-information"
            );
        });

        it("should build path with explicit journeyId and companyNumber when provided", () => {
            const req: Request = generateRequest();
            const journeyId = "explicit-journey-id";
            const companyNumber = "explicit-company-number";
            const pathTemplate = "/close-a-company/:journeyId/company/:companyNumber/view-company-information";

            const result = journeyPathService.journeyPath(req, pathTemplate, { journeyId, companyNumber });

            assert.equal(
                result,
                "/close-a-company/explicit-journey-id/company/explicit-company-number/view-company-information"
            );
        });

        it("should throw error when journeyId is missing from session", () => {
            const req: Request = generateRequest();
            const pathTemplate = "/close-a-company/:journeyId/company/:companyNumber/view-company-information";

            when(sessionServiceMock.requireJourneyId(anything())).thenThrow(new Error("No journeyId in session"));

            assert.throws(() => journeyPathService.journeyPath(req, pathTemplate), Error, "No journeyId in session");
        });

        it("should throw error when companyNumber is missing from session", () => {
            const req: Request = generateRequest();
            const journeyId = "e1101f0a-5121-4429-acee-a817c5cAAAAA";
            const pathTemplate = "/close-a-company/:journeyId/company/:companyNumber/view-company-information";

            when(sessionServiceMock.requireJourneyId(anything())).thenReturn(journeyId);
            when(sessionServiceMock.requireDissolutionCompanyNumber(anything())).thenThrow(
                new Error("No company number in dissolution session")
            );

            assert.throws(
                () => journeyPathService.journeyPath(req, pathTemplate),
                Error,
                "No company number in dissolution session"
            );
        });

        it("should merge additional params with journeyId and companyNumber", () => {
            const req: Request = generateRequest();
            const journeyId = "e1101f0a-5121-4429-acee-a817c5cAAAAA";
            const companyNumber = "12345678";
            const pathTemplate =
                "/close-a-company/:journeyId/company/:companyNumber/application-status/:signatoryId/change";

            when(sessionServiceMock.requireJourneyId(anything())).thenReturn(journeyId);
            when(sessionServiceMock.requireDissolutionCompanyNumber(anything())).thenReturn(companyNumber);

            const result = journeyPathService.journeyPath(req, pathTemplate, {
                params: { signatoryId: "sig-123" },
            });

            assert.equal(
                result,
                "/close-a-company/e1101f0a-5121-4429-acee-a817c5cAAAAA/company/12345678/application-status/sig-123/change"
            );
        });
    });
});
