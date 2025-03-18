import "reflect-metadata"

import { assert } from "chai"
import { Application } from "express"
import { StatusCodes } from "http-status-codes"
import request from "supertest"
import { anything, deepEqual, instance, mock, verify, when } from "ts-mockito"
import { generateOnBehalfChangeDetailsFormModel, generateWillSignChangeDetailsFormModel } from "../fixtures/companyOfficers.fixtures"
import { generateGetDirector } from "../fixtures/dissolutionApi.fixtures"
import { generateValidationError } from "../fixtures/error.fixtures"
import { generateDissolutionSession, TOKEN } from "../fixtures/session.fixtures"
import { createApp } from "./helpers/application.factory"
import HtmlAssertHelper from "./helpers/htmlAssert.helper"

import "app/controllers/changeDetails.controller"
import DissolutionDirectorMapper from "app/mappers/dissolution/dissolutionDirector.mapper"
import DissolutionGetDirector from "app/models/dto/dissolutionGetDirector"
import OfficerType from "app/models/dto/officerType.enum"
import ChangeDetailsFormModel from "app/models/form/changeDetails.model"
import SignatorySigning from "app/models/form/signatorySigning.enum"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import ValidationErrors from "app/models/view/validationErrors.model"
import { CHANGE_DETAILS_URI, WAIT_FOR_OTHERS_TO_SIGN_URI } from "app/paths"
import DissolutionDirectorService from "app/services/dissolution/dissolutionDirector.service"
import SessionService from "app/services/session/session.service"
import FormValidator from "app/utils/formValidator.util"
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock"

mockCsrfMiddleware.restore()

describe("ChangeDetailsController", () => {

    let session: SessionService
    let directorService: DissolutionDirectorService
    let directorMapper: DissolutionDirectorMapper
    let validator: FormValidator

    let dissolutionSession: DissolutionSession
    let signatoryToEdit: DissolutionGetDirector

    const SIGNATORY_ID = "abc123"

    beforeEach(() => {
        session = mock(SessionService)
        directorService = mock(DissolutionDirectorService)
        directorMapper = mock(DissolutionDirectorMapper)
        validator = mock(FormValidator)

        dissolutionSession = generateDissolutionSession()
        signatoryToEdit = generateGetDirector()

        when(session.getAccessToken(anything())).thenReturn(TOKEN)
    })

    function initApp (): Application {
        return createApp(container => {
            container.rebind(SessionService).toConstantValue(instance(session))
            container.rebind(DissolutionDirectorService).toConstantValue(instance(directorService))
            container.rebind(DissolutionDirectorMapper).toConstantValue(instance(directorMapper))
            container.rebind(FormValidator).toConstantValue(instance(validator))
        })
    }

    describe("GET", () => {
        it("should reject with a 404 if no signatory is in session to update", async () => {
            dissolutionSession.signatoryIdToEdit = undefined

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

            const app: Application = initApp()

            await request(app)
                .get(CHANGE_DETAILS_URI)
                .expect(StatusCodes.NOT_FOUND)
        })

        it("should render the change details page for the signatory", async () => {
            const form: ChangeDetailsFormModel = generateWillSignChangeDetailsFormModel()

            dissolutionSession.signatoryIdToEdit = SIGNATORY_ID
            signatoryToEdit.name = "Jimmy McGuiness"

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(directorService.getSignatoryToEdit(TOKEN, dissolutionSession)).thenResolve(signatoryToEdit)
            when(directorMapper.mapToChangeDetailsForm(signatoryToEdit)).thenReturn(form)

            const app: Application = initApp()

            const res = await request(app)
                .get(CHANGE_DETAILS_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.selectorExists(`#signatory`))
            assert.isTrue(htmlAssertHelper.hasText(`#signatory legend`, "Jimmy McGuiness"))
            assert.isTrue(htmlAssertHelper.selectorExists(`#is-signing`))
            assert.isTrue(htmlAssertHelper.selectorExists(`#is-signing-2`))
            assert.isTrue(htmlAssertHelper.selectorExists(`#director-email`))
            assert.isTrue(htmlAssertHelper.selectorExists(`#on-behalf-name`))
            assert.isTrue(htmlAssertHelper.selectorExists(`#on-behalf-email`))
        })

        it("should render the change details page with appropriate heading for DS01", async () => {
            const form: ChangeDetailsFormModel = generateWillSignChangeDetailsFormModel()

            dissolutionSession.signatoryIdToEdit = SIGNATORY_ID
            dissolutionSession.officerType = OfficerType.DIRECTOR

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(directorService.getSignatoryToEdit(TOKEN, dissolutionSession)).thenResolve(signatoryToEdit)
            when(directorMapper.mapToChangeDetailsForm(signatoryToEdit)).thenReturn(form)

            const app: Application = initApp()

            const res = await request(app)
                .get(CHANGE_DETAILS_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.hasText("h1", `Change director's details`))
        })

        it("should render the change details page with appropriate heading for LLDS01", async () => {
            const form: ChangeDetailsFormModel = generateWillSignChangeDetailsFormModel()

            dissolutionSession.signatoryIdToEdit = SIGNATORY_ID
            dissolutionSession.officerType = OfficerType.MEMBER

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(directorService.getSignatoryToEdit(TOKEN, dissolutionSession)).thenResolve(signatoryToEdit)
            when(directorMapper.mapToChangeDetailsForm(signatoryToEdit)).thenReturn(form)

            const app: Application = initApp()

            const res = await request(app)
                .get(CHANGE_DETAILS_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.hasText("h1", `Change member's details`))
        })

        it("should prepopulate the change details page for a signatory signing themselves", async () => {
            const form: ChangeDetailsFormModel = generateWillSignChangeDetailsFormModel()

            form.isSigning = SignatorySigning.WILL_SIGN
            form.directorEmail = "director@mail.com"
            form.onBehalfName = ""
            form.onBehalfEmail = ""

            dissolutionSession.signatoryIdToEdit = SIGNATORY_ID

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(directorService.getSignatoryToEdit(TOKEN, dissolutionSession)).thenResolve(signatoryToEdit)
            when(directorMapper.mapToChangeDetailsForm(signatoryToEdit)).thenReturn(form)

            const app: Application = initApp()

            const res = await request(app)
                .get(CHANGE_DETAILS_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.hasAttribute(`#is-signing`, "checked"))
            assert.isFalse(htmlAssertHelper.hasAttribute(`#is-signing-2`, "checked"))
            assert.equal(htmlAssertHelper.getValue(`#director-email`), "director@mail.com")
            assert.isNull(htmlAssertHelper.getValue(`#on-behalf-name`))
            assert.isNull(htmlAssertHelper.getValue(`#on-behalf-email`))
        })

        it("should prepopulate the change details page for a signatory where someone is signing on behalf of them", async () => {
            const form: ChangeDetailsFormModel = generateOnBehalfChangeDetailsFormModel()

            form.isSigning = SignatorySigning.ON_BEHALF
            form.directorEmail = ""
            form.onBehalfName = "Mr Accountant"
            form.onBehalfEmail = "accountant@mail.com"

            dissolutionSession.signatoryIdToEdit = SIGNATORY_ID

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(directorService.getSignatoryToEdit(TOKEN, dissolutionSession)).thenResolve(signatoryToEdit)
            when(directorMapper.mapToChangeDetailsForm(signatoryToEdit)).thenReturn(form)

            const app: Application = initApp()

            const res = await request(app)
                .get(CHANGE_DETAILS_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isFalse(htmlAssertHelper.hasAttribute(`#is-signing`, "checked"))
            assert.isTrue(htmlAssertHelper.hasAttribute(`#is-signing-2`, "checked"))
            assert.isNull(htmlAssertHelper.getValue(`#director-email`))
            assert.equal(htmlAssertHelper.getValue(`#on-behalf-name`), "Mr Accountant")
            assert.equal(htmlAssertHelper.getValue(`#on-behalf-email`), "accountant@mail.com")
        })
    })

    describe("POST", () => {
        it("should re-render the view with an error if validation fails", async () => {
            const form: ChangeDetailsFormModel = generateWillSignChangeDetailsFormModel()
            const error: ValidationErrors = generateValidationError(`isSigning`, "some is signing error")

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(validator.validate(deepEqual(form), anything())).thenReturn(error)
            when(directorService.getSignatoryToEdit(TOKEN, dissolutionSession)).thenResolve(signatoryToEdit)

            const app = initApp()

            const res = await request(app)
                .post(CHANGE_DETAILS_URI)
                .send(form)
                .expect(StatusCodes.BAD_REQUEST)

            verify(validator.validate(deepEqual(form), anything())).once()

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.selectorExists(".govuk-error-summary"))
            assert.isTrue(htmlAssertHelper.containsText(`#is-signing-error`, "some is signing error"))
        })

        it("should update the signatory and redirect to the wait for others to sign screen if validation passes", async () => {
            const form: ChangeDetailsFormModel = generateWillSignChangeDetailsFormModel()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(validator.validate(deepEqual(form), anything())).thenReturn(null)

            const app = initApp()

            await request(app)
                .post(CHANGE_DETAILS_URI)
                .send(form)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", WAIT_FOR_OTHERS_TO_SIGN_URI)

            verify(directorService.updateSignatory(TOKEN, dissolutionSession, deepEqual(form))).once()
        })
    })
})
