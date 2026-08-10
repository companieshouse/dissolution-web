import "reflect-metadata";

import { assert } from "chai";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { anything, instance, mock, when } from "ts-mockito";
import { createApp } from "./helpers/application.factory";
import HtmlAssertHelper from "./helpers/htmlAssert.helper";

import "app/controllers/applyUsingPaperForm.controller";
import { APPLY_USING_PAPER_FORM_URI } from "app/paths";
import OfficerType from "app/models/dto/officerType.enum";
import DissolutionSession from "app/models/session/dissolutionSession.model";
import SessionService from "app/services/session/session.service";
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock";
import { Application } from "express";
import { generateDissolutionSession } from "test/fixtures/session.fixtures";

mockCsrfMiddleware.restore();

describe("ApplyUsingPaperFormController", () => {
    function initApp(officerType: OfficerType): Application {
        const sessionService = mock(SessionService);
        const dissolutionSession: DissolutionSession = generateDissolutionSession("12345678");
        dissolutionSession.officerType = officerType;
        when(sessionService.requireOfficerType(anything())).thenReturn(officerType);

        return createApp(container => {
            container.rebind(SessionService).toConstantValue(instance(sessionService));
        });
    }

    describe("GET /apply-using-paper-form - DIRECTOR (DS01)", () => {
        it("should render the apply using paper form page", async () => {
            const app = initApp(OfficerType.DIRECTOR);

            const res = await request(app).get(APPLY_USING_PAPER_FORM_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(
                htmlAssertHelper.hasText("h1", "You'll need to apply using a paper form (DS01)"),
                "Should have correct heading"
            );
        });

        it("should display the download DS01 form link", async () => {
            const app = initApp(OfficerType.DIRECTOR);

            const res = await request(app).get(APPLY_USING_PAPER_FORM_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(
                htmlAssertHelper.containsText("body", "Download a DS01 paper form"),
                "Should have download link text"
            );
        });

        it("should display paper application cost information", async () => {
            const app = initApp(OfficerType.DIRECTOR);

            const res = await request(app).get(APPLY_USING_PAPER_FORM_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(htmlAssertHelper.containsText("body", "£18"), "Should mention application cost");
            assert.isTrue(
                htmlAssertHelper.containsText("body", "cheque or postal order"),
                "Should mention payment methods"
            );
        });

        it("should have Matomo tracking for download link", async () => {
            const app = initApp(OfficerType.DIRECTOR);

            const res = await request(app).get(APPLY_USING_PAPER_FORM_URI).expect(StatusCodes.OK);

            assert.include(
                res.text,
                "download-ds01-form-link",
                "Should have download-ds01-form-link event ID for tracking"
            );
        });

        it("should set page title correctly", async () => {
            const app = initApp(OfficerType.DIRECTOR);

            const res = await request(app).get(APPLY_USING_PAPER_FORM_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);
            assert.isTrue(
                htmlAssertHelper.hasText("h1", "You'll need to apply using a paper form (DS01)"),
                "Page heading should be correct"
            );
        });

        it("should mention company and directors for DS01", async () => {
            const app = initApp(OfficerType.DIRECTOR);

            const res = await request(app).get(APPLY_USING_PAPER_FORM_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(
                htmlAssertHelper.containsText("body", "This company has over 150 directors"),
                "Should mention company and directors"
            );
        });

        it("should have DS01 download link ID", async () => {
            const app = initApp(OfficerType.DIRECTOR);

            const res = await request(app).get(APPLY_USING_PAPER_FORM_URI).expect(StatusCodes.OK);

            assert.include(res.text, 'id="download-ds01-form"', "Should have DS01 download link with correct ID");
        });
    });

    describe("GET /apply-using-paper-form - MEMBER (LLDS01)", () => {
        it("should render the apply using paper form page with LLDS01 heading", async () => {
            const app = initApp(OfficerType.MEMBER);

            const res = await request(app).get(APPLY_USING_PAPER_FORM_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(
                htmlAssertHelper.hasText("h1", "You'll need to apply using a paper form (LLDS01)"),
                "Should have LLDS01 heading for LLP"
            );
        });

        it("should display the download LLDS01 form link", async () => {
            const app = initApp(OfficerType.MEMBER);

            const res = await request(app).get(APPLY_USING_PAPER_FORM_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(
                htmlAssertHelper.containsText("body", "Download an LLDS01 paper form"),
                "Should have LLDS01 download link text"
            );
        });

        it("should mention limited liability partnership and members", async () => {
            const app = initApp(OfficerType.MEMBER);

            const res = await request(app).get(APPLY_USING_PAPER_FORM_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(
                htmlAssertHelper.containsText("body", "This limited liability partnership (LLP) has over 150 members"),
                "Should mention limited liability partnership and members"
            );
        });

        it("should display paper application cost information for LLDS01", async () => {
            const app = initApp(OfficerType.MEMBER);

            const res = await request(app).get(APPLY_USING_PAPER_FORM_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(htmlAssertHelper.containsText("body", "£18"), "Should mention application cost");
            assert.isTrue(
                htmlAssertHelper.containsText("body", "cheque or postal order"),
                "Should mention payment methods"
            );
        });

        it("should have LLDS01 download link with correct ID", async () => {
            const app = initApp(OfficerType.MEMBER);

            const res = await request(app).get(APPLY_USING_PAPER_FORM_URI).expect(StatusCodes.OK);

            assert.include(res.text, 'id="download-ll-ds01-form"', "Should have LLDS01 download link with correct ID");
        });

        it("should reference correct LLDS01 form URL", async () => {
            const app = initApp(OfficerType.MEMBER);

            const res = await request(app).get(APPLY_USING_PAPER_FORM_URI).expect(StatusCodes.OK);

            assert.include(
                res.text,
                "strike-off-application-by-limited-liability-partnership-ll-ds01",
                "Should reference LLDS01 form URL"
            );
        });

        it("should have Matomo tracking for LLDS01 download link", async () => {
            const app = initApp(OfficerType.MEMBER);

            const res = await request(app).get(APPLY_USING_PAPER_FORM_URI).expect(StatusCodes.OK);

            assert.include(
                res.text,
                "download-ds01-form-link",
                "Should have download-ds01-form-link event ID for tracking"
            );
        });
    });
});
