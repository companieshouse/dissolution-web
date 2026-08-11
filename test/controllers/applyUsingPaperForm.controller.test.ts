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
import SessionService from "app/services/session/session.service";
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock";
import { Application } from "express";

mockCsrfMiddleware.restore();

describe("ApplyUsingPaperFormController", () => {
    let sessionService: SessionService;

    function initApp(): Application {
        return createApp(container => {
            container.rebind(SessionService).toConstantValue(instance(sessionService));
        });
    }

    beforeEach(() => {
        sessionService = mock(SessionService);
    });

    const expectedContentCases = [
        {
            description: "DIRECTOR (DS01)",
            officerType: OfficerType.DIRECTOR,
            expectedHeading: "You'll need to apply using a paper form (DS01)",
            expectedDownloadLinkText: "Download a DS01 paper form",
            expectedDownloadLinkSelector: "#download-ds01-form",
            expectedMentionText: "This company has over 150 directors",
            expectedFormUrl: "https://www.gov.uk/government/publications/strike-off-a-company-from-the-register-ds01",
        },
        {
            description: "MEMBER (LLDS01)",
            officerType: OfficerType.MEMBER,
            expectedHeading: "You'll need to apply using a paper form (LLDS01)",
            expectedDownloadLinkText: "Download an LLDS01 paper form",
            expectedDownloadLinkSelector: "#download-ll-ds01-form",
            expectedMentionText: "This limited liability partnership (LLP) has over 150 members",
            expectedFormUrl:
                "https://www.gov.uk/government/publications/strike-off-application-by-limited-liability-partnership-ll-ds01",
        },
    ];

    expectedContentCases.forEach(tc => {
        describe(`GET /apply-using-paper-form - ${tc.description}`, () => {
            it("should render the apply using paper form page with the correct content", async () => {
                when(sessionService.requireOfficerType(anything())).thenReturn(tc.officerType);

                const res = await request(initApp()).get(APPLY_USING_PAPER_FORM_URI).expect(StatusCodes.OK);

                const assertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text);
                const bodyText = assertHelper.getBodyText();

                assert.equal(assertHelper.getText("h1"), tc.expectedHeading, "Should have correct heading");
                assert.include(bodyText, tc.expectedMentionText, "Should mention correct company/officer type text");
                assert.include(bodyText, "£18", "Should mention application cost");
                assert.include(bodyText, "cheque or postal order", "Should mention payment methods");
                assert.isTrue(
                    assertHelper.selectorExists(tc.expectedDownloadLinkSelector),
                    "Should have download link with correct ID"
                );
                assert.equal(
                    assertHelper.getText(tc.expectedDownloadLinkSelector),
                    tc.expectedDownloadLinkText,
                    "Should have download link text"
                );
                assert.equal(
                    assertHelper.getAttributeValue(tc.expectedDownloadLinkSelector, "href"),
                    tc.expectedFormUrl,
                    "Should reference correct form URL"
                );
                assert.equal(
                    assertHelper.getAttributeValue(tc.expectedDownloadLinkSelector, "data-event-id"),
                    "download-ds01-form-link",
                    "Should have Matomo tracking event ID"
                );
            });
        });
    });
});
