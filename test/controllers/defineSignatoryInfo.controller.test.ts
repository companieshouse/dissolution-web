import "reflect-metadata"

import { assert } from "chai"
import { StatusCodes } from "http-status-codes"
import request from "supertest"
import { anything, capture, deepEqual, instance, mock, verify, when } from "ts-mockito"
import { generateDirectorToSign, generateDissolutionSession } from "../fixtures/session.fixtures"
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
import { generateDefineSignatoryInfoFormModel } from "test/fixtures/companyOfficers.fixtures"
import { aDefineSignatoryInfoForm } from "test/fixtures/defineSignatoryInfoForm.builder"
import { Application } from "express"
import { DefineSignatoryInfoFormModel } from "app/models/form/defineSignatoryInfo.model"
import ValidationErrors from "app/models/view/validationErrors.model"
import { generateValidationError } from "test/fixtures/error.fixtures"
import { ArgCaptor2 } from "ts-mockito/lib/capture/ArgCaptor"

mockCsrfMiddleware.restore()

describe("DefineSignatoryInfoController", () => {
    let session: SessionService
    let signatoryService: SignatoryService
    let validator: FormValidator

    const APPLICANT_ID = "123"
    const SIGNATORY_1_ID = "456AbC"
    const SIGNATORY_2_ID = "789dEf"

    const SIGNATORY_1_ID_LOWER = SIGNATORY_1_ID.toLowerCase()
    const SIGNATORY_2_ID_LOWER = SIGNATORY_2_ID.toLowerCase()

    let dissolutionSession: DissolutionSession

    beforeEach(() => {
        session = mock(SessionService)
        signatoryService = mock(SignatoryService)
        validator = mock(FormValidator)

        const applicant: DirectorToSign = generateDirectorToSign()
        applicant.isApplicant = true
        applicant.id = APPLICANT_ID

        const signatory1: DirectorToSign = generateDirectorToSign()
        signatory1.isApplicant = false
        signatory1.name = "Jimmy McGuiness"
        signatory1.id = SIGNATORY_1_ID

        const signatory2: DirectorToSign = generateDirectorToSign()
        signatory2.isApplicant = false
        signatory2.name = "Jane Smith"
        signatory2.id = SIGNATORY_2_ID

        dissolutionSession = generateDissolutionSession()
        dissolutionSession.directorsToSign = [applicant, signatory1, signatory2]
    })

    describe("GET", () => {
        it("should render the define signatory info page with one section per signatory", async () => {
            const customSession = aDissolutionSession()
                .withDirectorToSign(aDirectorToSign().withId(APPLICANT_ID).asApplicant().withName("Mrs Applicant Person"))
                .withDirectorToSign(aDirectorToSign().withId(SIGNATORY_1_ID).withName("Mr Standard Director Signatory").withOfficerRole(OfficerRole.DIRECTOR))
                .withDirectorToSign(aDirectorToSign().withId(SIGNATORY_2_ID).withName("Mr Corporate Signatory").withOfficerRole(OfficerRole.CORPORATE_DIRECTOR))
                .build()

            when(session.getDissolutionSession(anything())).thenReturn(customSession)

            const app = createApp(container => {
                container.rebind(SessionService).toConstantValue(instance(session))
            })

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
                const { officerType, expectedPageHeading, expectedExplanatoryText } = testCase

                when(session.getDissolutionSession(anything())).thenReturn(aDissolutionSession().withOfficerType(officerType).build())

                const app = createApp(container => {
                    container.rebind(SessionService).toConstantValue(instance(session))
                })

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

            const app = createApp(container => {
                container.rebind(SessionService).toConstantValue(instance(session))
            })

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
                dissolutionSession.isMultiDirector = true

                when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

                const app = createApp(container => {
                    container.rebind(SessionService).toConstantValue(instance(session))
                })

                const res = await request(app)
                    .get(DEFINE_SIGNATORY_INFO_URI)
                    .expect(StatusCodes.OK)

                const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

                assert.equal(htmlAssertHelper.getAttributeValue(".govuk-back-link", "href"), SELECT_SIGNATORIES_URI)
            })

            it("should set the back button to the select director page if multi director journey", async () => {
                dissolutionSession.isMultiDirector = false

                when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

                const app = createApp(container => {
                    container.rebind(SessionService).toConstantValue(instance(session))
                })

                const res = await request(app)
                    .get(DEFINE_SIGNATORY_INFO_URI)
                    .expect(StatusCodes.OK)

                const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

                assert.equal(htmlAssertHelper.getAttributeValue(".govuk-back-link", "href"), SELECT_DIRECTOR_URI)
            })
        })
    })

    describe("POST", () => {
        function initApp (): Application {
            return createApp(container => {
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(SignatoryService).toConstantValue(instance(signatoryService))
                container.rebind(FormValidator).toConstantValue(instance(validator))
            })
        }

        it("should re-render the view with an error if validation fails", async () => {
            const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()
            const error: ValidationErrors = generateValidationError(`isSigning_${SIGNATORY_2_ID_LOWER}`, "some is signing error")

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(validator.validate(deepEqual(form), anything())).thenReturn(error)

            const app = initApp()

            const res = await request(app)
                .post(DEFINE_SIGNATORY_INFO_URI)
                .send(form)
                .expect(StatusCodes.BAD_REQUEST)

            verify(validator.validate(deepEqual(form), anything())).once()

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.selectorExists(".govuk-error-summary"))
            assert.isTrue(htmlAssertHelper.containsText(`#is-signing_${SIGNATORY_2_ID_LOWER}-error`, "some is signing error"))
        })

        describe("session", () => {
            it("should not update session if nothing has changed", async () => {
                const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

                dissolutionSession.defineSignatoryInfoForm = form

                when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
                when(validator.validate(deepEqual(form), anything())).thenReturn(null)

                const app = initApp()

                await request(app)
                    .post(DEFINE_SIGNATORY_INFO_URI)
                    .send(form)
                    .expect(StatusCodes.MOVED_TEMPORARILY)

                verify(session.setDissolutionSession(anything(), anything())).never()
            })

            // it("should store the form in session if validation passes", async () => {
            //     const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()
            //
            //     dissolutionSession.defineSignatoryInfoForm = undefined
            //
            //     when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            //     when(validator.validate(deepEqual(form), anything())).thenReturn(null)
            //
            //     const app = initApp()
            //
            //     await request(app)
            //         .post(DEFINE_SIGNATORY_INFO_URI)
            //         .send(form)
            //         .expect(StatusCodes.MOVED_TEMPORARILY)
            //
            //     verify(session.setDissolutionSession(anything(), anything())).once()
            //
            //     const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
            //     const updatedSession: DissolutionSession = sessionCaptor.last()[1]
            //
            //     assert.deepEqual(updatedSession.defineSignatoryInfoForm, form)
            // })

            it("should update the signatories with the provided contact info if validation passes", async () => {
                const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

                when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
                when(validator.validate(deepEqual(form), anything())).thenReturn(null)

                const app = initApp()

                await request(app)
                    .post(DEFINE_SIGNATORY_INFO_URI)
                    .send(form)
                    .expect(StatusCodes.MOVED_TEMPORARILY)

                verify(signatoryService.updateSignatoriesWithContactInfo(anything(), deepEqual(form))).once()

                const signatoryCaptor: ArgCaptor2<DirectorToSign[], DefineSignatoryInfoFormModel> =
          capture<DirectorToSign[], DefineSignatoryInfoFormModel>(signatoryService.updateSignatoriesWithContactInfo)
                const signatories: DirectorToSign[] = signatoryCaptor.last()[0]

                assert.equal(signatories.length, 2)
                assert.equal(signatories[0].id, SIGNATORY_1_ID)
                assert.equal(signatories[1].id, SIGNATORY_2_ID)
            })
        })

        it("should redirect to the check your answers screen if validation passes", async () => {
            const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(validator.validate(deepEqual(form), anything())).thenReturn(null)

            const app = initApp()

            await request(app)
                .post(DEFINE_SIGNATORY_INFO_URI)
                .send(form)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", CHECK_YOUR_ANSWERS_URI)
        })
    })
})
