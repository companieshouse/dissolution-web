import "reflect-metadata"

import { assert } from "chai"
import { StatusCodes } from "http-status-codes"
import request from "supertest"
import { anything, capture, deepEqual, instance, mock, verify, when } from "ts-mockito"
import { aDissolutionSession } from "../fixtures/dissolutionSession.builder"
import { createApp } from "./helpers/application.factory"
import HtmlAssertHelper from "./helpers/htmlAssert.helper"

import "app/controllers/defineSignatoryInfo.controller"
import OfficerType from "app/models/dto/officerType.enum"
import { DirectorToSign } from "app/models/session/directorToSign.model"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import {
    CHECK_YOUR_ANSWERS_URI,
    DEFINE_SIGNATORY_INFO_URI,
    SELECT_DIRECTOR_URI,
    SELECT_SIGNATORIES_URI
} from "app/paths"
import SessionService from "app/services/session/session.service"
import SignatoryService from "app/services/signatories/signatory.service"
import FormValidator from "app/utils/formValidator.util"
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock"
import OfficerRole from "app/models/dto/officerRole.enum"
import { aDirectorToSign } from "test/fixtures/directorToSign.builder"
import { aDefineSignatoryInfoForm } from "test/fixtures/defineSignatoryInfoForm.builder"
import { Application } from "express"

mockCsrfMiddleware.restore()

describe("DefineSignatoryInfoController", () => {
    let session: SessionService
    let signatoryService: SignatoryService

    const APPLICANT_ID = "123"
    const SIGNATORY_1_ID = "456AbC"
    const SIGNATORY_2_ID = "789dEf"

    const SIGNATORY_1_ID_LOWER = SIGNATORY_1_ID.toLowerCase()
    const SIGNATORY_2_ID_LOWER = SIGNATORY_2_ID.toLowerCase()

    function initApp (): Application {
        return createApp(container => {
            container.rebind(SessionService).toConstantValue(instance(session))
            container.rebind(SignatoryService).toConstantValue(instance(signatoryService))
            container.rebind(FormValidator).toConstantValue(new FormValidator())
        })
    }

    beforeEach(() => {
        session = mock(SessionService)
        signatoryService = mock(SignatoryService)
    })

    describe("GET", () => {
        it("should render the define signatory info page with one section per signatory", async () => {
            const customSession = aDissolutionSession()
                .withDirectorToSign(aDirectorToSign().withId(APPLICANT_ID).asApplicant().withName("Mrs Applicant Person"))
                .withDirectorToSign(aDirectorToSign().withId(SIGNATORY_1_ID).withName("Mr Standard Director Signatory").withOfficerRole(OfficerRole.DIRECTOR))
                .withDirectorToSign(aDirectorToSign().withId(SIGNATORY_2_ID).withName("Mr Corporate Signatory").withOfficerRole(OfficerRole.CORPORATE_DIRECTOR))
                .build()

            when(session.getDissolutionSession(anything())).thenReturn(customSession)

            const app = initApp()

            const res = await request(app)
                .get(DEFINE_SIGNATORY_INFO_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.selectorDoesNotExist(`#director-email_${APPLICANT_ID}`))
            assert.isTrue(htmlAssertHelper.hasText(`label[for="director-email_${SIGNATORY_1_ID_LOWER}"]`, "Mr Standard Director Signatory"))
            assert.isTrue(htmlAssertHelper.selectorExists(`#director-email_${SIGNATORY_1_ID_LOWER}`))
            assert.isTrue(htmlAssertHelper.containsText("legend.govuk-label--m", "Mr Corporate Signatory"))
            assert.isTrue(htmlAssertHelper.selectorExists(`#on-behalf-name_${SIGNATORY_2_ID_LOWER}`))
            assert.isTrue(htmlAssertHelper.selectorExists(`#on-behalf-email_${SIGNATORY_2_ID_LOWER}`))
        })

        const expectedContentCases = [
            {
                description: "DS01 journey",
                officerType: OfficerType.DIRECTOR,
                expectedPageHeading: "Provide directors' email addresses",
                expectedExplanatoryText: "We'll email each director you've selected, to ask them to sign the application online."
            },
            {
                description: "LLDS01 journey",
                officerType: OfficerType.MEMBER,
                expectedPageHeading: "Provide members' email addresses",
                expectedExplanatoryText: "We'll email each member you've selected, to ask them to sign the application online."
            }
        ]

        expectedContentCases.forEach((testCase) => {
            it(`should render the select signatories page with correct static content for ${testCase.description}`, async () => {
                const {
                    officerType,
                    expectedPageHeading,
                    expectedExplanatoryText
                } = testCase

                when(session.getDissolutionSession(anything())).thenReturn(aDissolutionSession().withOfficerType(officerType).build())

                const app = initApp()

                const res = await request(app)
                    .get(DEFINE_SIGNATORY_INFO_URI)
                    .expect(StatusCodes.OK)

                const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

                assert.isTrue(htmlAssertHelper.containsText("title", expectedPageHeading))
                assert.isTrue(htmlAssertHelper.hasText("h1", expectedPageHeading))
                assert.isTrue(htmlAssertHelper.containsRawText(expectedExplanatoryText))
            })
        })

        it("should prepopulate the define signatory info page with the selected signatories from session", async () => {
            const form = aDefineSignatoryInfoForm()
                .withDirectorEmail(SIGNATORY_1_ID_LOWER, "director@mail.com")
                .withOnBehalfName(SIGNATORY_2_ID_LOWER, "Mr Accountant")
                .withOnBehalfEmail(SIGNATORY_2_ID_LOWER, "accountant@mail.com")
                .build()

            when(session.getDissolutionSession(anything())).thenReturn(aDissolutionSession()
                .withDirectorToSign(aDirectorToSign().withId(SIGNATORY_1_ID).withName("Standard signatory").withOfficerRole(OfficerRole.DIRECTOR))
                .withDirectorToSign(aDirectorToSign().withId(SIGNATORY_2_ID).withName("Corporate signatory").withOfficerRole(OfficerRole.CORPORATE_DIRECTOR))
                .withDefineSignatoryInfoForm(form).build())

            const app = initApp()

            const res = await request(app)
                .get(DEFINE_SIGNATORY_INFO_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.equal(htmlAssertHelper.getValue(`#director-email_${SIGNATORY_1_ID_LOWER}`), "director@mail.com")
            assert.equal(htmlAssertHelper.getValue(`#on-behalf-name_${SIGNATORY_2_ID_LOWER}`), "Mr Accountant")
            assert.equal(htmlAssertHelper.getValue(`#on-behalf-email_${SIGNATORY_2_ID_LOWER}`), "accountant@mail.com")
        })

        describe("back button", () => {
            it("should set the button button to the select signatories page if multi director journey", async () => {

                when(session.getDissolutionSession(anything())).thenReturn(
                    aDissolutionSession()
                        .withDirectorToSign(aDirectorToSign().withId(SIGNATORY_1_ID).withName("Standard signatory").withOfficerRole(OfficerRole.DIRECTOR))
                        .withIsMultiDirector(true)
                        .build())

                const app = initApp()

                const res = await request(app)
                    .get(DEFINE_SIGNATORY_INFO_URI)
                    .expect(StatusCodes.OK)

                const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

                assert.equal(htmlAssertHelper.getAttributeValue(".govuk-back-link", "href"), SELECT_SIGNATORIES_URI)
            })

            it("should set the back button to the select director page if multi director journey", async () => {
                when(session.getDissolutionSession(anything())).thenReturn(
                    aDissolutionSession()
                        .withDirectorToSign(aDirectorToSign().withId(SIGNATORY_1_ID).withName("Standard signatory").withOfficerRole(OfficerRole.DIRECTOR))
                        .withIsMultiDirector(false)
                        .build())

                const app = initApp()

                const res = await request(app)
                    .get(DEFINE_SIGNATORY_INFO_URI)
                    .expect(StatusCodes.OK)

                const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

                assert.equal(htmlAssertHelper.getAttributeValue(".govuk-back-link", "href"), SELECT_DIRECTOR_URI)
            })
        })
    })

    describe("POST", () => {
        it("should re-render the view with an error if validation fails", async () => {

            const form = aDefineSignatoryInfoForm()
                .withDirectorEmail(SIGNATORY_1_ID_LOWER, "not-an-email") // invalid email
                .build()

            when(session.getDissolutionSession(anything())).thenReturn(aDissolutionSession()
                .withDirectorToSign(aDirectorToSign().withId(SIGNATORY_1_ID).withName("Standard signatory").withOfficerRole(OfficerRole.DIRECTOR))
                .withDefineSignatoryInfoForm(form).build())

            const app = initApp()

            const res = await request(app)
                .post(DEFINE_SIGNATORY_INFO_URI)
                .send(form)
                .expect(StatusCodes.BAD_REQUEST)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.containsText(`.govuk-error-summary`, "Enter a valid email address"))
        })

        describe("session", () => {
            it("should not update session if nothing has changed", async () => {

                const form = aDefineSignatoryInfoForm()
                    .withDirectorEmail(SIGNATORY_1_ID_LOWER, "director@mail.com")
                    .build()

                when(session.getDissolutionSession(anything())).thenReturn(aDissolutionSession()
                    .withDirectorToSign(aDirectorToSign().withId(SIGNATORY_1_ID).withName("Standard signatory").withOfficerRole(OfficerRole.DIRECTOR))
                    .withDefineSignatoryInfoForm(form).build())

                const app = initApp()

                await request(app)
                    .post(DEFINE_SIGNATORY_INFO_URI)
                    .send(form)
                    .expect(StatusCodes.MOVED_TEMPORARILY)

                verify(session.setDissolutionSession(anything(), anything())).never()
            })

            it("should store the form in session if validation passes", async () => {

                const form = aDefineSignatoryInfoForm()
                    .withDirectorEmail(SIGNATORY_1_ID_LOWER, "director@mail.com")
                    .build()

                when(session.getDissolutionSession(anything())).thenReturn(aDissolutionSession()
                    .withDirectorToSign(aDirectorToSign().withId(SIGNATORY_1_ID).withName("Standard signatory").withOfficerRole(OfficerRole.DIRECTOR))
                    .build())

                const app = initApp()

                await request(app)
                    .post(DEFINE_SIGNATORY_INFO_URI)
                    .send(form)
                    .expect(StatusCodes.MOVED_TEMPORARILY)

                verify(session.setDissolutionSession(anything(), anything())).once()

                const sessionCaptor = capture(session.setDissolutionSession)
                const updatedSession: DissolutionSession = sessionCaptor.last()[1]

                assert.deepEqual(updatedSession.defineSignatoryInfoForm, form)
            })

            it("should update the signatories with the provided contact info if validation passes", async () => {

                const form = aDefineSignatoryInfoForm()
                    .withDirectorEmail(SIGNATORY_1_ID_LOWER, "director@mail.com")
                    .withOnBehalfName(SIGNATORY_2_ID_LOWER, "Mr Accountant")
                    .withOnBehalfEmail(SIGNATORY_2_ID_LOWER, "accountant@mail.com")
                    .build()

                when(session.getDissolutionSession(anything())).thenReturn(aDissolutionSession()
                    .withDirectorToSign(aDirectorToSign().withId(SIGNATORY_1_ID).withName("Standard signatory"))
                    .withDirectorToSign(aDirectorToSign().withId(SIGNATORY_2_ID).withName("Corporate signatory").withOfficerRole(OfficerRole.CORPORATE_DIRECTOR))
                    .build())

                const app = initApp()

                await request(app)
                    .post(DEFINE_SIGNATORY_INFO_URI)
                    .send(form)
                    .expect(StatusCodes.MOVED_TEMPORARILY)

                verify(signatoryService.updateSignatoriesWithContactInfo(anything(), deepEqual(form))).once()

                const signatoryCaptor = capture(signatoryService.updateSignatoriesWithContactInfo)
                const signatories: DirectorToSign[] = signatoryCaptor.last()[0]

                assert.equal(signatories.length, 2)
                assert.equal(signatories[0].id, SIGNATORY_1_ID)
                assert.equal(signatories[1].id, SIGNATORY_2_ID)
            })
        })

        it("should redirect to the check your answers screen if validation passes", async () => {

            const form = aDefineSignatoryInfoForm()
                .withDirectorEmail(SIGNATORY_1_ID_LOWER, "director@email.com") // invalid email
                .build()

            when(session.getDissolutionSession(anything())).thenReturn(
                aDissolutionSession()
                    .withDirectorToSign(aDirectorToSign().withId(SIGNATORY_1_ID).withName("Standard signatory").withOfficerRole(OfficerRole.DIRECTOR))
                    .build())

            const app = initApp()

            await request(app)
                .post(DEFINE_SIGNATORY_INFO_URI)
                .send(form)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", CHECK_YOUR_ANSWERS_URI)
        })
    })
})
