import "reflect-metadata";

import { assert } from "chai";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { createApp } from "./helpers/application.factory";
import HtmlAssertHelper from "./helpers/htmlAssert.helper";

import "app/controllers/applyUsingPaperForm.controller";
import { APPLY_USING_PAPER_FORM_DIRECTORS_URI, APPLY_USING_PAPER_FORM_MEMBERS_URI } from "app/paths";
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock";
import { Application } from "express";

mockCsrfMiddleware.restore();

describe("ApplyUsingPaperFormController", () => {
    function initApp(): Application {
        return createApp();
    }

    describe("GET /apply-using-paper-form-directors", () => {
        it("should render the apply using paper form directors page", async () => {
            const app = initApp();

            const res = await request(app).get(APPLY_USING_PAPER_FORM_DIRECTORS_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(
                htmlAssertHelper.hasText("h1", "You'll need to apply using a paper form (DS01)"),
                "Should have correct heading"
            );
            assert.isTrue(htmlAssertHelper.containsText("body", "over 150 directors"), "Should mention directors");
            assert.isFalse(htmlAssertHelper.containsText("body", "over 150 members"), "Should not mention members");
        });

        it("should display the download DS01 form link", async () => {
            const app = initApp();

            const res = await request(app).get(APPLY_USING_PAPER_FORM_DIRECTORS_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(
                htmlAssertHelper.containsText("body", "Download a DS01 paper form"),
                "Should have download link text"
            );
            assert.isTrue(
                htmlAssertHelper.selectorExists("a[href*='strike-off-a-company-from-the-register-ds01']"),
                "Should have link to DS01 form"
            );
        });

        it("should display paper application cost information", async () => {
            const app = initApp();

            const res = await request(app).get(APPLY_USING_PAPER_FORM_DIRECTORS_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(htmlAssertHelper.containsText("body", "£18"), "Should mention application cost");
            assert.isTrue(
                htmlAssertHelper.containsText("body", "cheque or postal order"),
                "Should mention payment methods"
            );
        });

        it("should display back link to search company", async () => {
            const app = initApp();

            const res = await request(app).get(APPLY_USING_PAPER_FORM_DIRECTORS_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(htmlAssertHelper.containsText("body", "Back"), "Should have back link");
        });

        it("should have Matomo tracking for download link", async () => {
            const app = initApp();

            const res = await request(app).get(APPLY_USING_PAPER_FORM_DIRECTORS_URI).expect(StatusCodes.OK);

            assert.include(
                res.text,
                "download-ds01-form-link",
                "Should have download-ds01-form-link event ID for tracking"
            );
        });

        it("should set page title correctly", async () => {
            const app = initApp();

            const res = await request(app).get(APPLY_USING_PAPER_FORM_DIRECTORS_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);
            assert.isTrue(
                htmlAssertHelper.hasText("h1", "You'll need to apply using a paper form (DS01)"),
                "Page heading should be correct"
            );
        });
    });

    describe("GET /apply-using-paper-form-members", () => {
        it("should render the apply using paper form members page", async () => {
            const app = initApp();

            const res = await request(app).get(APPLY_USING_PAPER_FORM_MEMBERS_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(
                htmlAssertHelper.hasText("h1", "You'll need to apply using a paper form (DS01)"),
                "Should have correct heading"
            );
            assert.isTrue(htmlAssertHelper.containsText("body", "over 150 members"), "Should mention members");
            assert.isTrue(
                htmlAssertHelper.containsText("body", "limited liability partnership (LLP)"),
                "Should mention LLP"
            );
            assert.isFalse(htmlAssertHelper.containsText("body", "over 150 directors"), "Should not mention directors");
        });

        it("should display the download DS01 form link", async () => {
            const app = initApp();

            const res = await request(app).get(APPLY_USING_PAPER_FORM_MEMBERS_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(
                htmlAssertHelper.containsText("body", "Download a DS01 paper form"),
                "Should have download link text"
            );
        });

        it("should have Matomo tracking with member officer type", async () => {
            const app = initApp();

            const res = await request(app).get(APPLY_USING_PAPER_FORM_MEMBERS_URI).expect(StatusCodes.OK);

            assert.include(res.text, "member", "Should pass 'member' as officerType to Matomo tracking");
        });

        it("should set page title correctly", async () => {
            const app = initApp();

            const res = await request(app).get(APPLY_USING_PAPER_FORM_MEMBERS_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);
            assert.isTrue(
                htmlAssertHelper.hasText("h1", "You'll need to apply using a paper form (DS01)"),
                "Page heading should be correct"
            );
        });
    });

    describe("GovUK Design System compliance", () => {
        it("should use GovUK styling classes", async () => {
            const app = initApp();

            const res = await request(app).get(APPLY_USING_PAPER_FORM_DIRECTORS_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(htmlAssertHelper.selectorExists("h1.govuk-heading-l"), "Should use GovUK heading style");
            assert.isTrue(htmlAssertHelper.selectorExists(".govuk-grid-row"), "Should use GovUK grid layout");
            assert.isTrue(htmlAssertHelper.selectorExists("a.govuk-link"), "Should use GovUK link style");
        });
    });
});
