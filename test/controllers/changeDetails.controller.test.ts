import "reflect-metadata"

import { assert } from "chai"
import { Application } from "express"
import { StatusCodes } from "http-status-codes"
import request from "supertest"
import { anything, deepEqual, instance, mock, verify, when } from "ts-mockito"
import { TOKEN } from "../fixtures/session.fixtures"
import { createApp } from "./helpers/application.factory"
import HtmlAssertHelper from "./helpers/htmlAssert.helper"

import "app/controllers/changeDetails.controller"
import DissolutionGetDirector from "app/models/dto/dissolutionGetDirector"
import OfficerType from "app/models/dto/officerType.enum"
import ChangeDetailsFormModel from "app/models/form/changeDetails.model"
import { CHANGE_DETAILS_URI, CHECK_YOUR_ANSWERS_URI, WAIT_FOR_OTHERS_TO_SIGN_URI } from "app/paths"
import DissolutionDirectorService from "app/services/dissolution/dissolutionDirector.service"
import SessionService from "app/services/session/session.service"
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock"
import { aChangeDetailsFormModel } from "test/fixtures/changeDetailsFormModel.builder"
import { aDissolutionGetDirector } from "test/fixtures/dissolutionGetDirector.builder"
import { aDirectorToSign } from "test/fixtures/directorToSign.builder"
import { aDissolutionSession } from "test/fixtures/dissolutionSession.builder"

mockCsrfMiddleware.restore()

describe("ChangeDetailsController", () => {

    let session: SessionService
    let directorService: DissolutionDirectorService

    const SIGNATORY_ID = "abc123"

    beforeEach(() => {
        session = mock(SessionService)
        directorService = mock(DissolutionDirectorService)

        when(session.getAccessToken(anything())).thenReturn(TOKEN)
    })

    function initApp (): Application {
        return createApp(container => {
            container.rebind(SessionService).toConstantValue(instance(session))
            container.rebind(DissolutionDirectorService).toConstantValue(instance(directorService))
        })
    }

    describe("GET", () => {
        it("should reject with a 404 if no signatory is in session to update", async () => {

            const dissolutionSession = aDissolutionSession().withSignatoryIdToEdit().build()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

            const app: Application = initApp()

            const res = await request(app)
                .get(CHANGE_DETAILS_URI)
                .expect(StatusCodes.NOT_FOUND)

            assert.equal(res.status, StatusCodes.NOT_FOUND)
        })

        it("should retrieve a natural signatory from session if isFromCheckAnswers is true", async () => {

            const isFromCheckAnswers = true
            const officerType = OfficerType.DIRECTOR
            const expectedPageHeading = "Change a director's email address"

            const dissolutionSession = aDissolutionSession().withSignatoryIdToEdit(SIGNATORY_ID).withOfficerType(officerType)
                .withIsFromCheckAnswers(isFromCheckAnswers).build()

            const directorToSign = aDirectorToSign().withId(SIGNATORY_ID).withEmail("director@mail.com")
                .withName("Mr Standard Director Signatory").build()
            dissolutionSession.directorsToSign = [directorToSign]

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            const app: Application = initApp()

            const res = await request(app)
                .get(CHANGE_DETAILS_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.containsText("title", expectedPageHeading))
            assert.equal(htmlAssertHelper.getText("h1"), expectedPageHeading)
            assert.equal(htmlAssertHelper.getText(`label[for="director-email"]`), "Mr Standard Director Signatory")
            assert.equal(htmlAssertHelper.getValue(`#director-email`), "director@mail.com")
            assert.isUndefined(htmlAssertHelper.getValue(`#on-behalf-name`))
            assert.isUndefined(htmlAssertHelper.getValue(`#on-behalf-email`))
        })

        it("should retrieve a corporate signatory from session if isFromCheckAnswers is true", async () => {

            const isFromCheckAnswers = true
            const officerType = OfficerType.DIRECTOR
            const expectedPageHeading = "Change a director's details"

            const dissolutionSession = aDissolutionSession().withSignatoryIdToEdit(SIGNATORY_ID).withOfficerType(officerType)
                .withIsFromCheckAnswers(isFromCheckAnswers).build()

            const directorToSign = aDirectorToSign().withId(SIGNATORY_ID).withEmail("director@mail.com")
                .withOnBehalfName("Mr Corporate Director Signatory").build()
            dissolutionSession.directorsToSign = [directorToSign]

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            const app: Application = initApp()

            const res = await request(app)
                .get(CHANGE_DETAILS_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.containsText("title", expectedPageHeading))
            assert.equal(htmlAssertHelper.getText("h1"), expectedPageHeading)
            assert.equal(htmlAssertHelper.getValue(`#on-behalf-name`), "Mr Corporate Director Signatory")
            assert.equal(htmlAssertHelper.getValue(`#on-behalf-email`), "director@mail.com")
            assert.isUndefined(htmlAssertHelper.getValue(`#director-email`))
        })

        it("should throw a 404 if isFromCheckAnswers is true and there are no signatories in session and isFromCheckAnswers is true", async () => {
            const isFromCheckAnswers = true
            const dissolutionSession = aDissolutionSession().withSignatoryIdToEdit().withIsFromCheckAnswers(isFromCheckAnswers).build()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

            const app: Application = initApp()

            const res = await request(app)
                .get(CHANGE_DETAILS_URI)
                .expect(StatusCodes.NOT_FOUND)

            assert.equal(res.status, StatusCodes.NOT_FOUND)
        })

        const expectedContentCasesStandardDirector = [
            {
                description: "DS01 journey",
                officerType: OfficerType.DIRECTOR,
                expectedPageHeading: "Change a director's email address"
            },
            {
                description: "LLDS01 journey",
                officerType: OfficerType.MEMBER,
                expectedPageHeading: "Change a member's email address"
            }
        ]

        expectedContentCasesStandardDirector.forEach((testCase) => {
            it(`should render the change details page with correct content for a standard director ${testCase.description}`, async () => {
                const {
                    officerType,
                    expectedPageHeading
                } = testCase

                const dissolutionSession = aDissolutionSession().withSignatoryIdToEdit(SIGNATORY_ID).withOfficerType(officerType).build()
                const signatoryToEdit: DissolutionGetDirector = aDissolutionGetDirector()
                    .withName("Mr Standard Director Signatory")
                    .withEmail("director@mail.com").build()

                when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
                when(directorService.getSignatoryToEdit(TOKEN, dissolutionSession)).thenResolve(signatoryToEdit)

                const app: Application = initApp()

                const res = await request(app)
                    .get(CHANGE_DETAILS_URI)
                    .expect(StatusCodes.OK)

                const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

                assert.isTrue(htmlAssertHelper.containsText("title", expectedPageHeading))
                assert.equal(htmlAssertHelper.getText("h1"), expectedPageHeading)
                assert.equal(htmlAssertHelper.getText(`label[for="director-email"]`), "Mr Standard Director Signatory")
                assert.equal(htmlAssertHelper.getValue(`#director-email`), "director@mail.com")
                assert.isUndefined(htmlAssertHelper.getValue(`#on-behalf-name`))
                assert.isUndefined(htmlAssertHelper.getValue(`#on-behalf-email`))
            })
        })

        const expectedContentCasesCorporateDirector = [
            {
                description: "DS01 journey",
                officerType: OfficerType.DIRECTOR,
                expectedPageHeading: "Change a director's details"
            },
            {
                description: "LLDS01 journey",
                officerType: OfficerType.MEMBER,
                expectedPageHeading: "Change a member's details"
            }
        ]

        expectedContentCasesCorporateDirector.forEach((testCase) => {
            it(`should render the change details page with correct content for a corporate director ${testCase.description}`, async () => {
                const {
                    officerType,
                    expectedPageHeading
                } = testCase

                const dissolutionSession = aDissolutionSession().withSignatoryIdToEdit(SIGNATORY_ID).withOfficerType(officerType).build()
                // when onBehalfName is specified it's a corporate director
                const signatoryToEdit: DissolutionGetDirector = aDissolutionGetDirector()
                    .withName("Corporate Director Signatory")
                    .withOnBehalfName("Mr Accountant")
                    .withEmail("accountant@mail.com").build()

                when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
                when(directorService.getSignatoryToEdit(TOKEN, dissolutionSession)).thenResolve(signatoryToEdit)

                const app: Application = initApp()

                const res = await request(app)
                    .get(CHANGE_DETAILS_URI)
                    .expect(StatusCodes.OK)

                const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

                assert.isTrue(htmlAssertHelper.containsText("title", expectedPageHeading))
                assert.equal(htmlAssertHelper.getText("h1"), expectedPageHeading)
                assert.isTrue(htmlAssertHelper.containsText("legend.govuk-label--m", "Corporate Director Signatory"))
                assert.equal(htmlAssertHelper.getValue(`#on-behalf-name`), "Mr Accountant")
                assert.equal(htmlAssertHelper.getValue(`#on-behalf-email`), "accountant@mail.com")
                assert.isUndefined(htmlAssertHelper.getValue(`#director-email`))
            })
        })
    })

    describe("POST", () => {
        it("should reject with a 404 if no signatory is in session to update", async () => {
            const dissolutionSession = aDissolutionSession().withSignatoryIdToEdit().build()
            const updatedDetails: ChangeDetailsFormModel = aChangeDetailsFormModel().withDirectorEmail("updated.email@mail.com").build()
            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            const app: Application = initApp()
            const res = await request(app)
                .post(CHANGE_DETAILS_URI)
                .send(updatedDetails)
                .expect(StatusCodes.NOT_FOUND)

            assert.equal(res.status, StatusCodes.NOT_FOUND)
        })

        it("should re-render the view with an error if validation fails for a standard director", async () => {

            const signatoryToEdit = aDissolutionGetDirector().withName("Mr Standard Director").withOnBehalfName(null).build()

            const dissolutionSession = aDissolutionSession()
                .withSignatoryIdToEdit(SIGNATORY_ID)
                .withSignatoryToEdit(signatoryToEdit)
                .build()

            const updatedDetails: ChangeDetailsFormModel = aChangeDetailsFormModel().withDirectorEmail("an invalid email").build()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(directorService.getSignatoryToEdit(TOKEN, dissolutionSession)).thenResolve(signatoryToEdit)

            const app = initApp()

            const res = await request(app)
                .post(CHANGE_DETAILS_URI)
                .send(updatedDetails)
                .expect(StatusCodes.BAD_REQUEST)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.containsText(`.govuk-error-summary`, "Enter an email address in the correct format, like name@example.com"))
            const altErrorText = htmlAssertHelper.getAttributeValue(".govuk-error-summary__list li a", "data-alt-text")
            assert.equal(altErrorText, "invalid-email")
        })

        it("should re-render the view with an error if validation fails for a corporate director", async () => {

            const signatoryToEdit = aDissolutionGetDirector().withOnBehalfName("Mr Accountant").build()

            const dissolutionSession = aDissolutionSession()
                .withSignatoryIdToEdit(SIGNATORY_ID)
                .withSignatoryToEdit(signatoryToEdit)
                .build()

            const updatedDetails: ChangeDetailsFormModel = aChangeDetailsFormModel().withOnBehalfEmail("an invalid email").build()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(directorService.getSignatoryToEdit(TOKEN, dissolutionSession)).thenResolve(signatoryToEdit)

            const app = initApp()

            const res = await request(app)
                .post(CHANGE_DETAILS_URI)
                .send(updatedDetails)
                .expect(StatusCodes.BAD_REQUEST)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.containsText(`.govuk-error-summary`, "Enter an email address in the correct format, like name@example.com"))
        })

        it("should update the signatory and redirect to the wait for others to sign screen if validation passes for a standard director", async () => {
            const dissolutionSession = aDissolutionSession()
                .withSignatoryIdToEdit(SIGNATORY_ID)
                .withSignatoryToEdit(aDissolutionGetDirector().withName("Mr Standard Director").withOnBehalfName(null).build())
                .build()

            const updatedDetails: ChangeDetailsFormModel = aChangeDetailsFormModel().withDirectorEmail("updated.email@mail.com").build()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

            const res = await request(initApp())
                .post(CHANGE_DETAILS_URI)
                .send(updatedDetails)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", WAIT_FOR_OTHERS_TO_SIGN_URI)

            verify(directorService.updateSignatory(TOKEN, dissolutionSession, deepEqual(updatedDetails))).once()
            assert.equal(res.status, StatusCodes.MOVED_TEMPORARILY)
            assert.equal(res.header.location, WAIT_FOR_OTHERS_TO_SIGN_URI)
        })

        it("should update the signatory and redirect to the wait for others to sign screen if validation passes for a corporate director", async () => {
            const dissolutionSession = aDissolutionSession()
                .withSignatoryIdToEdit(SIGNATORY_ID)
                .withSignatoryToEdit(aDissolutionGetDirector().withOnBehalfName("Mr Accountant").build())
                .build()

            const updatedDetails: ChangeDetailsFormModel = aChangeDetailsFormModel()
                .withDirectorEmail()
                .withOnBehalfName("Mr Accountant Updated")
                .withOnBehalfEmail("updated.accountant@mail.com").build()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

            const res = await request(initApp())
                .post(CHANGE_DETAILS_URI)
                .send(updatedDetails)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", WAIT_FOR_OTHERS_TO_SIGN_URI)

            verify(directorService.updateSignatory(TOKEN, dissolutionSession, deepEqual(updatedDetails))).once()
            assert.equal(res.status, StatusCodes.MOVED_TEMPORARILY)
            assert.equal(res.header.location, WAIT_FOR_OTHERS_TO_SIGN_URI)
        })

        it("should update the signatory in session and redirect to the check your answers screen if validation passes for a natural director", async () => {
            const isFromCheckAnswers = true
            const updatedEmail = "updated.accountant@mail.com"

            const dissolutionSession = aDissolutionSession()
                .withSignatoryIdToEdit(SIGNATORY_ID)
                .withIsFromCheckAnswers(isFromCheckAnswers)
                .withSignatoryToEdit(aDissolutionGetDirector().withName("Mr Accountant").build())
                .build()

            const directorToSign = aDirectorToSign().withId(SIGNATORY_ID).withEmail("director@mail.com").withName("Mr Accountant").build()
            dissolutionSession.directorsToSign = [directorToSign]

            const updatedDetails: ChangeDetailsFormModel = aChangeDetailsFormModel()
                .withDirectorEmail(updatedEmail)
                .build()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

            const res = await request(initApp())
                .post(CHANGE_DETAILS_URI)
                .send(updatedDetails)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", CHECK_YOUR_ANSWERS_URI)

            const updatedDirectorsToSign = dissolutionSession.directorsToSign
            assert.equal(updatedDirectorsToSign[0].email, updatedEmail)
            assert.equal(res.status, StatusCodes.MOVED_TEMPORARILY)
            assert.equal(res.header.location, CHECK_YOUR_ANSWERS_URI)
        })

        it("should update the signatory in session and redirect to the check your answers screen if validation passes for a corporate director", async () => {
            const isFromCheckAnswers = true
            const updatedName = "Mr Accountant Updated"
            const updatedEmail = "updated.accountant@mail.com"

            const dissolutionSession = aDissolutionSession()
                .withSignatoryIdToEdit(SIGNATORY_ID)
                .withIsFromCheckAnswers(isFromCheckAnswers)
                .withSignatoryToEdit(aDissolutionGetDirector().withOnBehalfName("Mr Accountant").build())
                .build()

            const directorToSign = aDirectorToSign().withId(SIGNATORY_ID).withEmail("director@mail.com").withOnBehalfName("Mr Accountant").build()
            dissolutionSession.directorsToSign = [directorToSign]

            const updatedDetails: ChangeDetailsFormModel = aChangeDetailsFormModel()
                .withDirectorEmail()
                .withOnBehalfName(updatedName)
                .withOnBehalfEmail(updatedEmail).build()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

            const res = await request(initApp())
                .post(CHANGE_DETAILS_URI)
                .send(updatedDetails)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", CHECK_YOUR_ANSWERS_URI)

            const updatedDirectorsToSign = dissolutionSession.directorsToSign
            assert.equal(updatedDirectorsToSign[0].onBehalfName, updatedName)
            assert.equal(updatedDirectorsToSign[0].email, updatedEmail)
            assert.equal(res.status, StatusCodes.MOVED_TEMPORARILY)
            assert.equal(res.header.location, CHECK_YOUR_ANSWERS_URI)
        })

        it("should return a 404 if isFromCheckAnswers is true and no signatories in session", async () => {
            const isFromCheckAnswers = true
            const updatedEmail = "updated.accountant@mail.com"

            const signatoryToEdit = aDissolutionGetDirector().withName("Mr Standard Director").withEmail("email@email.com").build()

            const dissolutionSession = aDissolutionSession()
                .withSignatoryIdToEdit(SIGNATORY_ID)
                .withSignatoryToEdit(signatoryToEdit)
                .withIsFromCheckAnswers(isFromCheckAnswers)
                .build()

            const updatedDetails: ChangeDetailsFormModel = aChangeDetailsFormModel()
                .withDirectorEmail(updatedEmail)
                .build()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

            const res = await request(initApp())
                .post(CHANGE_DETAILS_URI)
                .send(updatedDetails)
                .expect(StatusCodes.NOT_FOUND)

            assert.equal(res.status, StatusCodes.NOT_FOUND)
        })

        it("should return a 404 if isFromCheckAnswers is true and signatory to edit not found in signatories array", async () => {
            const isFromCheckAnswers = true
            const updatedEmail = "updated.accountant@mail.com"

            const signatoryToEdit = aDissolutionGetDirector().withName("Mr Standard Director").withEmail("email@email.com").build()

            const dissolutionSession = aDissolutionSession()
                .withSignatoryIdToEdit(SIGNATORY_ID)
                .withSignatoryToEdit(signatoryToEdit)
                .withIsFromCheckAnswers(isFromCheckAnswers)
                .build()

            const directorToSign = aDirectorToSign().withId("def456").withEmail("director@mail.com").withName("Mr Accountant").build()
            dissolutionSession.directorsToSign = [directorToSign]

            const updatedDetails: ChangeDetailsFormModel = aChangeDetailsFormModel()
                .withDirectorEmail(updatedEmail)
                .build()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

            const res = await request(initApp())
                .post(CHANGE_DETAILS_URI)
                .send(updatedDetails)
                .expect(StatusCodes.NOT_FOUND)

            assert.equal(res.status, StatusCodes.NOT_FOUND)
        })

        it("should re-render the view with an error and the signatory in session if validation fails and isFromCheckAnswers is true", async () => {

            const isFromCheckAnswers = true
            const signatoryToEdit = aDissolutionGetDirector().withName("Mr Standard Director").withOnBehalfName(null).build()

            const dissolutionSession = aDissolutionSession()
                .withSignatoryIdToEdit(SIGNATORY_ID)
                .withSignatoryToEdit(signatoryToEdit)
                .withIsFromCheckAnswers(isFromCheckAnswers)
                .build()

            const updatedDetails: ChangeDetailsFormModel = aChangeDetailsFormModel().withDirectorEmail("an invalid email").build()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

            const app = initApp()

            const res = await request(app)
                .post(CHANGE_DETAILS_URI)
                .send(updatedDetails)
                .expect(StatusCodes.BAD_REQUEST)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            verify(directorService.getSignatoryToEdit(TOKEN, dissolutionSession)).never()
            assert.isTrue(htmlAssertHelper.containsText(`.govuk-error-summary`, "Enter an email address in the correct format, like name@example.com"))
            const altErrorText = htmlAssertHelper.getAttributeValue(".govuk-error-summary__list li a", "data-alt-text")
            assert.equal(altErrorText, "invalid-email")
        })
    })
})
