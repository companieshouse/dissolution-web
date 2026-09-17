import { assert } from "chai";
import { generateRequest } from "test/fixtures/http.fixtures";
import { Request } from "express";
import JourneyPathService from "app/services/session/journeyPath.service";

describe("JourneyPathService", () => {
    let journeyPathService: JourneyPathService;

    beforeEach(() => {
        journeyPathService = new JourneyPathService();
    });

    describe("journeyPath", () => {
        it("should build path with journeyId and companyNumber from path params when not provided", () => {
            const req: Request = generateRequest();
            req.params.journeyId = "e1101f0a-5121-4429-acee-a817c5cAAAAA";
            req.params.companyNumber = "12345678";
            const pathTemplate = "/close-a-company/:journeyId/company/:companyNumber/view-company-information";

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

        it("should throw error when journeyId is missing from path params", () => {
            const req: Request = generateRequest();
            req.params.companyNumber = "12345678";
            const pathTemplate = "/close-a-company/:journeyId/company/:companyNumber/view-company-information";

            assert.throws(() => journeyPathService.journeyPath(req, pathTemplate), Error, "No journeyId");
        });

        it("should throw error when companyNumber is missing from path params", () => {
            const req: Request = generateRequest();
            req.params.journeyId = "e1101f0a-5121-4429-acee-a817c5cAAAAA";
            const pathTemplate = "/close-a-company/:journeyId/company/:companyNumber/view-company-information";

            assert.throws(() => journeyPathService.journeyPath(req, pathTemplate), Error, "No companyNumber");
        });

        it("should merge additional params with journeyId and companyNumber", () => {
            const req: Request = generateRequest();
            req.params.journeyId = "e1101f0a-5121-4429-acee-a817c5cAAAAA";
            req.params.companyNumber = "12345678";
            const pathTemplate =
                "/close-a-company/:journeyId/company/:companyNumber/application-status/:signatoryId/change";

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
