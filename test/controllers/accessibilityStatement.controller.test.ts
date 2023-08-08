import "reflect-metadata";

import { expect } from "chai";
import request from "supertest";
import { createApp } from "./helpers/application.factory";

import "app/controllers/accessibilityStatement.controller";
import { ACCESSIBILITY_STATEMENT_URI } from "app/paths";

const pageHeading = "Accessibility statement for the Apply to strike off and dissolve a company service";

describe("AccessibilityStatementController", () => {

    describe("GET request", () => {
        it("should match the heading when trying to access the page", async () => {
            const app = createApp();
            await request(app).get(ACCESSIBILITY_STATEMENT_URI).expect(response => {
                expect(response.text).to.contain(pageHeading);
            });
        });
    });
});
