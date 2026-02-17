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
import DissolutionDirectorMapper from "app/mappers/dissolution/dissolutionDirector.mapper"
import DissolutionGetDirector from "app/models/dto/dissolutionGetDirector"
import OfficerType from "app/models/dto/officerType.enum"
import ChangeDetailsFormModel from "app/models/form/changeDetails.model"
import { CHANGE_DETAILS_URI, WAIT_FOR_OTHERS_TO_SIGN_URI } from "app/paths"
import DissolutionDirectorService from "app/services/dissolution/dissolutionDirector.service"
import SessionService from "app/services/session/session.service"
import FormValidator from "app/utils/formValidator.util"
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock"
import { aChangeDetailsFormModel } from "test/fixtures/changeDetailsFormModel.builder"
import { aDissolutionGetDirector } from "test/fixtures/dissolutionGetDirector.builder"
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
            container.rebind(DissolutionDirectorMapper).toConstantValue(new DissolutionDirectorMapper())
            container.rebind(FormValidator).toConstantValue(new FormValidator())
        })
    }

    describe("GET", () => {
        it("should reject with a 404 if no signatory is in session to update", async () => {

            const dissolutionSession = aDissolutionSession().withSignatoryIdToEdit(undefined).build()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

            const app: Application = initApp()

            await request(app)
                .get(CHANGE_DETAILS_URI)
                .expect(StatusCodes.NOT_FOUND)
        })

        it("should render the change details page for the signatory", async () => {

            const dissolutionSession = aDissolutionSession().withSignatoryIdToEdit(SIGNATORY_ID).build()
            const signatoryToEdit: DissolutionGetDirector = aDissolutionGetDirector().withName("Mr Standard Director Signatory").build()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(directorService.getSignatoryToEdit(TOKEN, dissolutionSession)).thenResolve(signatoryToEdit)

            const app: Application = initApp()

            const res = await request(app)
                .get(CHANGE_DETAILS_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.hasText(`label[for="director-email"]`, "Mr Standard Director Signatory"))
            assert.isTrue(htmlAssertHelper.selectorExists(`#director-email`))
        })

        const expectedContentCases = [
            {
                description: "DS01 journey",
                officerType: OfficerType.DIRECTOR,
                expectedPageHeading: "Change director's details"
            },
            {
                description: "LLDS01 journey",
                officerType: OfficerType.MEMBER,
                expectedPageHeading: "Change member's details"
            }
        ]

        expectedContentCases.forEach((testCase) => {
            it(`should render the change details page with correct static content for ${testCase.description}`, async () => {
                const {
                    officerType,
                    expectedPageHeading
                } = testCase

                const dissolutionSession = aDissolutionSession().withSignatoryIdToEdit(SIGNATORY_ID).withOfficerType(officerType).build()
                const signatoryToEdit: DissolutionGetDirector = aDissolutionGetDirector().withName("Mr Standard Director Signatory").build()

                when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
                when(directorService.getSignatoryToEdit(TOKEN, dissolutionSession)).thenResolve(signatoryToEdit)

                const app: Application = initApp()

                const res = await request(app)
                    .get(CHANGE_DETAILS_URI)
                    .expect(StatusCodes.OK)

                const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

                assert.isTrue(htmlAssertHelper.containsText("title", expectedPageHeading))
                assert.equal(htmlAssertHelper.getText("h1"), expectedPageHeading)
            })
        })

        it("should prepopulate the change details page for standard director", async () => {
            const dissolutionSession = aDissolutionSession().withSignatoryIdToEdit(SIGNATORY_ID).build()
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

            assert.equal(htmlAssertHelper.getValue(`#director-email`), "director@mail.com")
            assert.isUndefined(htmlAssertHelper.getValue(`#on-behalf-name`))
            assert.isUndefined(htmlAssertHelper.getValue(`#on-behalf-email`))
        })

        it("should prepopulate the change details page for a corporate director", async () => {
            const dissolutionSession = aDissolutionSession().withSignatoryIdToEdit(SIGNATORY_ID).build()
            // when onBehalfName is specified it's a corporate director
            const signatoryToEdit: DissolutionGetDirector = aDissolutionGetDirector()
                .withOnBehalfName("Mr Accountant")
                .withEmail("accountant@mail.com").build()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(directorService.getSignatoryToEdit(TOKEN, dissolutionSession)).thenResolve(signatoryToEdit)

            const app: Application = initApp()

            const res = await request(app)
                .get(CHANGE_DETAILS_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.equal(htmlAssertHelper.getValue(`#on-behalf-name`), "Mr Accountant")
            assert.equal(htmlAssertHelper.getValue(`#on-behalf-email`), "accountant@mail.com")
            assert.isUndefined(htmlAssertHelper.getValue(`#director-email`))
        })
    })

    describe("POST", () => {
        it("should re-render the view with an error if validation fails", async () => {

            const signatoryToEdit = aDissolutionGetDirector().withName("Mr Standard Director").withOnBehalfName(null).build()

            const dissolutionSession = aDissolutionSession()
                .withSignatoryIdToEdit(SIGNATORY_ID)
                .withSignatoryToEdit(signatoryToEdit)
                .build()

            const updatedForm: ChangeDetailsFormModel = aChangeDetailsFormModel().withDirectorEmail("an invalid email").build()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(directorService.getSignatoryToEdit(TOKEN, dissolutionSession)).thenResolve(signatoryToEdit)

            const app = initApp()

            const res = await request(app)
                .post(CHANGE_DETAILS_URI)
                .send(updatedForm)
                .expect(StatusCodes.BAD_REQUEST)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.containsText(`.govuk-error-summary`, "Enter an email address in the correct format, like name@example.com"))
        })

        it("should update the signatory and redirect to the wait for others to sign screen if validation passes", async () => {
            const dissolutionSession = aDissolutionSession()
                .withSignatoryIdToEdit(SIGNATORY_ID)
                .withSignatoryToEdit(aDissolutionGetDirector().withName("Mr Standard Director").withOnBehalfName(null).build())
                .build()

            const updatedDetails: ChangeDetailsFormModel = aChangeDetailsFormModel().withDirectorEmail("updated.email@mail.com").build()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

            await request(initApp())
                .post(CHANGE_DETAILS_URI)
                .send(updatedDetails)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", WAIT_FOR_OTHERS_TO_SIGN_URI)

            verify(directorService.updateSignatory(TOKEN, anything(), deepEqual(updatedDetails))).once()
        })
    })
})
