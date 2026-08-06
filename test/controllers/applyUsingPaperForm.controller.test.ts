import "reflect-metadata";

import { assert } from "chai";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { createApp } from "./helpers/application.factory";
import HtmlAssertHelper from "./helpers/htmlAssert.helper";

import "app/controllers/applyUsingPaperForm.controller";
import { APPLY_USING_PAPER_FORM_URI } from "app/paths";
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock";
import { Application } from "express";

mockCsrfMiddleware.restore();

describe("ApplyUsingPaperFormController", () => {
    const APPLY_URI = `${APPLY_USING_PAPER_FORM_URI}`;

    function initApp(): Application {
        return createApp();
    }

    describe("GET /apply-using-paper-form", () => {
        it("should render the apply using paper form page", async () => {
            const app = initApp();

            const res = await request(app).get(APPLY_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(
                htmlAssertHelper.hasText("h1", "You'll need to apply using a paper form (DS01)"),
                "Should have correct heading"
            );
        });

        it("should display the download DS01 form link", async () => {
            const app = initApp();

            const res = await request(app).get(APPLY_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(
                htmlAssertHelper.containsText("body", "Download a DS01 paper form"),
                "Should have download link text"
            );
        });

        it("should display paper application cost information", async () => {
            const app = initApp();

            const res = await request(app).get(APPLY_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(htmlAssertHelper.containsText("body", "£18"), "Should mention application cost");
            assert.isTrue(
                htmlAssertHelper.containsText("body", "cheque or postal order"),
                "Should mention payment methods"
            );
        });

        it("should have Matomo tracking for download link", async () => {
            const app = initApp();

            const res = await request(app).get(APPLY_URI).expect(StatusCodes.OK);

            assert.include(
                res.text,
                "download-ds01-form-link",
                "Should have download-ds01-form-link event ID for tracking"
            );
        });

        it("should set page title correctly", async () => {
            const app = initApp();

            const res = await request(app).get(APPLY_URI).expect(StatusCodes.OK);

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

            const res = await request(app).get(APPLY_URI).expect(StatusCodes.OK);

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);

            assert.isTrue(htmlAssertHelper.selectorExists("h1.govuk-heading-l"), "Should use GovUK heading style");
            assert.isTrue(htmlAssertHelper.selectorExists(".govuk-grid-row"), "Should use GovUK grid layout");
            assert.isTrue(htmlAssertHelper.selectorExists("a.govuk-link"), "Should use GovUK link style");
        });
    });
});
