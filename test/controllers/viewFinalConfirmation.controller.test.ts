import "reflect-metadata"

import { assert } from "chai"
import { Application } from "express"
import { StatusCodes } from "http-status-codes"
import request from "supertest"
import { anything, instance, mock, when } from "ts-mockito"
import { generateDissolutionGetResponse } from "../fixtures/dissolutionApi.fixtures"
import { generateDissolutionSession } from "../fixtures/session.fixtures"
import { createApp } from "./helpers/application.factory"
import HtmlAssertHelper from "./helpers/htmlAssert.helper"

import "app/controllers/viewFinalConfirmation.controller"
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse"
import OfficerType from "app/models/dto/officerType.enum"
import Optional from "app/models/optional"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import { VIEW_FINAL_CONFIRMATION_URI } from "app/paths"
import DissolutionService from "app/services/dissolution/dissolution.service"
import SessionService from "app/services/session/session.service"
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock"

mockCsrfMiddleware.restore()

describe("ViewFinalConfirmationController", () => {

    const APPLICATION_REFERENCE_NUMBER = "OVFFTH"
    const PANEL_TITLE = "Application received"
    const COMPANY_NUMBER_LABEL = "Company number"
    const COMPANY_NAME_LABEL = "Company name"
    const DIRECTORS_HEADING = "Directors must inform all interested parties"
    const MEMBERS_HEADING = "Members must inform all interested parties"
    const DIRECTORS_INSTRUCTION = "The directors must send a copy to all interested parties within 7 days of making the application."
    const MEMBERS_INSTRUCTION = "The members must send a copy to all interested parties within 7 days of making the application."
    const GUIDANCE_LINK_TEXT = "full list of interested parties to tell about the company closing (opens in new tab)"
    const FEEDBACK_LINK_TEXT = "feedback (opens in a new tab)"
    const WARNING_TEXT = "It is a criminal offence not to tell all interested parties that an application has been made to close the company."
    const EMAIL_CONFIRM_TEXT = "We'll email you to confirm that we've received the application."
    const EMAIL_RESULT_TEXT = "We'll email you again within 2 working days to let you know if the application has been accepted or rejected."
    const WHAT_NEXT_HEADING = "What happens next"
    const WHAT_NEXT_NOTICE = "We'll publish a strike off notice for the company in the relevant Gazette."
    const WHAT_NEXT_DISSOLVE = "After 2 months, unless there is an objection to the company closing, another notice will be published in the relevant Gazette and the company will be dissolved."
    const DOWNLOAD_LINK_ID = "#certificate-download"
    const DOWNLOAD_LINK_TARGET = "_blank"
    const DOWNLOAD_LINK_HREF = "certificate-download"

    let session: SessionService
    let dissolution: Optional<DissolutionGetResponse>
    let dissolutionService: DissolutionService
    let dissolutionSession: DissolutionSession
    let app: Application

    const TOKEN = "some-token"

    beforeEach(() => {
        session = mock(SessionService)

        dissolutionService = mock(DissolutionService)

        dissolution = generateDissolutionGetResponse()

        dissolutionSession = generateDissolutionSession()
        dissolutionSession.applicationReferenceNumber = APPLICATION_REFERENCE_NUMBER

        app = createApp(container => {
            container.rebind(SessionService).toConstantValue(instance(session))
            container.rebind(DissolutionService).toConstantValue(instance(dissolutionService))
        })

        when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)
        when(session.getAccessToken(anything())).thenReturn(TOKEN)
        when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
    })

    describe("GET request", () => {
        it("should render the ViewFinalConfirmation page with correct reference number and panel title", async () => {
            const res = await request(app)
                .get(VIEW_FINAL_CONFIRMATION_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            // Panel title
            assert.isTrue(htmlAssertHelper.containsText(".govuk-panel__title", PANEL_TITLE))
            // Reference number
            assert.isTrue(htmlAssertHelper.containsText(".govuk-panel__body", APPLICATION_REFERENCE_NUMBER))
        })

        it("should render the ViewFinalConfirmation page with company number and name in summary list", async () => {
            const res = await request(app)
                .get(VIEW_FINAL_CONFIRMATION_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            // Company number and name in summary list (target dt and dd directly for specificity)
            assert.isTrue(htmlAssertHelper.anyTagHasText("dt", COMPANY_NUMBER_LABEL))
            assert.isTrue(htmlAssertHelper.anyTagHasText("dd", dissolution!.company_number))
            assert.isTrue(htmlAssertHelper.anyTagHasText("dt", COMPANY_NAME_LABEL))
            assert.isTrue(htmlAssertHelper.anyTagHasText("dd", dissolution!.company_name))
        })

        it("should render the ViewFinalConfirmation page with officerType-specific headings and instructions for DIRECTOR", async () => {
            dissolutionSession.officerType = OfficerType.DIRECTOR
            const res = await request(app)
                .get(VIEW_FINAL_CONFIRMATION_URI)
                .expect(StatusCodes.OK)
            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            // Use h2 for heading specificity
            assert.isTrue(htmlAssertHelper.anyTagHasText("h2", DIRECTORS_HEADING))
            assert.isTrue(htmlAssertHelper.containsRawText(DIRECTORS_INSTRUCTION))
        })

        it("should render the ViewFinalConfirmation page with officerType-specific headings and instructions for MEMBER", async () => {
            dissolutionSession.officerType = OfficerType.MEMBER
            const res = await request(app)
                .get(VIEW_FINAL_CONFIRMATION_URI)
                .expect(StatusCodes.OK)
            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            // Use h2 for heading specificity
            assert.isTrue(htmlAssertHelper.anyTagHasText("h2", MEMBERS_HEADING))
            assert.isTrue(htmlAssertHelper.containsRawText(MEMBERS_INSTRUCTION))
        })

        it("should render the ViewFinalConfirmation page with updated guidance and feedback links", async () => {
            const res = await request(app)
                .get(VIEW_FINAL_CONFIRMATION_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            // Guidance link
            assert.isTrue(htmlAssertHelper.containsRawText(GUIDANCE_LINK_TEXT))
            // Feedback link
            assert.isTrue(htmlAssertHelper.containsRawText(FEEDBACK_LINK_TEXT))
        })

        it("should render the ViewFinalConfirmation page with warning text", async () => {
            const res = await request(app)
                .get(VIEW_FINAL_CONFIRMATION_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            assert.isTrue(htmlAssertHelper.containsRawText(WARNING_TEXT))
        })

        it("should render the ViewFinalConfirmation page with email notification text", async () => {
            const res = await request(app)
                .get(VIEW_FINAL_CONFIRMATION_URI)
                .expect(StatusCodes.OK)
            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            assert.isTrue(htmlAssertHelper.containsRawText(EMAIL_CONFIRM_TEXT))
            assert.isTrue(htmlAssertHelper.containsRawText(EMAIL_RESULT_TEXT))
        })

        it("should render the ViewFinalConfirmation page with 'What happens next' section", async () => {
            const res = await request(app)
                .get(VIEW_FINAL_CONFIRMATION_URI)
                .expect(StatusCodes.OK)
            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            // Use h2 for heading specificity
            assert.isTrue(htmlAssertHelper.anyTagHasText("h2", WHAT_NEXT_HEADING))
            assert.isTrue(htmlAssertHelper.containsRawText(WHAT_NEXT_NOTICE))
            assert.isTrue(htmlAssertHelper.containsRawText(WHAT_NEXT_DISSOLVE))
        })

        it("should render the ViewFinalConfirmation page with download link and correct attributes", async () => {
            const res = await request(app)
                .get(VIEW_FINAL_CONFIRMATION_URI)
                .expect(StatusCodes.OK)
            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            // Download link present
            assert.isTrue(htmlAssertHelper.selectorExists(DOWNLOAD_LINK_ID))
            // Link opens in new tab
            assert.equal(htmlAssertHelper.getAttributeValue(DOWNLOAD_LINK_ID, "target"), DOWNLOAD_LINK_TARGET)
            // Link has correct href
            assert.isTrue(htmlAssertHelper.getAttributeValue(DOWNLOAD_LINK_ID, "href")?.includes(DOWNLOAD_LINK_HREF))
        })
    })
})
