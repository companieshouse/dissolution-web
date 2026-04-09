import "reflect-metadata"

import {assert} from "chai"
import {Application, Request} from "express"
import {StatusCodes} from "http-status-codes"
import request from "supertest"
import {anything, capture, deepEqual, instance, mock, verify, when} from "ts-mockito"
import {ArgCaptor2} from "ts-mockito/lib/capture/ArgCaptor"
import {generateDirectorDetails, generateSelectDirectorFormModel} from "../fixtures/companyOfficers.fixtures"
import {aDirectorDetails} from "../fixtures/directorDetails.builder"
import {generateValidationError} from "../fixtures/error.fixtures"
import {generateDissolutionSession, TOKEN} from "../fixtures/session.fixtures"
import {createApp} from "./helpers/application.factory"
import HtmlAssertHelper from "./helpers/htmlAssert.helper"

import "app/controllers/selectDirector.controller"
import DirectorToSignMapper from "app/mappers/check-your-answers/directorToSign.mapper"
import OfficerType from "app/models/dto/officerType.enum"
import SelectDirectorFormModel from "app/models/form/selectDirector.model"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import DirectorDetails from "app/models/view/directorDetails.model"
import ValidationErrors from "app/models/view/validationErrors.model"
import {CHECK_YOUR_ANSWERS_URI, DEFINE_SIGNATORY_INFO_URI, SELECT_DIRECTOR_URI, SELECT_SIGNATORIES_URI} from "app/paths"
import selectDirectorSchema from "app/schemas/selectDirector.schema"
import CompanyOfficersService from "app/services/company-officers/companyOfficers.service"
import SessionService from "app/services/session/session.service"
import FormValidator from "app/utils/formValidator.util"
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock"
import OfficerRole from "app/models/dto/officerRole.enum";
import {aDissolutionSession} from "../fixtures/dissolutionSession.builder"
import {aSelectDirectorFormModel} from "test/fixtures/selectDirectorForm.builder";

mockCsrfMiddleware.restore()

describe("SelectDirectorController", () => {

    let session: SessionService
    let officerService: CompanyOfficersService
    let validator: FormValidator

    const COMPANY_NUMBER = "01777777"

    const DIRECTOR_1_ID = "123"
    const DIRECTOR_2_ID = "456"
    const NOT_A_DIRECTOR_ID = "other"

    let dissolutionSession: DissolutionSession

    beforeEach(() => {
        session = mock(SessionService)
        officerService = mock(CompanyOfficersService)
        validator = mock(FormValidator)

        when(session.getAccessToken(anything())).thenReturn(TOKEN)

        dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
        dissolutionSession.officerType = OfficerType.DIRECTOR
    })

    describe("GET - ensure that page loads correctly", () => {

        function initApp (): Application {
            return createApp(container => {
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
                container.rebind(DirectorToSignMapper).toConstantValue(new DirectorToSignMapper())
            })
        }

        it("should render the select director page with the relevant options", async () => {
            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
                {...generateDirectorDetails(), id: DIRECTOR_1_ID},
                {...generateDirectorDetails(), id: DIRECTOR_2_ID}
            ])

            const app = createApp(container => {
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
            })

            const res = await request(app)
                .get(SELECT_DIRECTOR_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.equal(htmlAssertHelper.getValue("#select-director"), DIRECTOR_1_ID)
            assert.equal(htmlAssertHelper.getValue("#select-director-2"), DIRECTOR_2_ID)
            assert.equal(htmlAssertHelper.getValue("#select-director-4"), NOT_A_DIRECTOR_ID)
        })

        it("should render the select director page with directors for DS01", async () => {
            dissolutionSession.officerType = OfficerType.DIRECTOR

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
                {...generateDirectorDetails(), id: DIRECTOR_1_ID},
                {...generateDirectorDetails(), id: DIRECTOR_2_ID}
            ])

            const app = createApp(container => {
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
            })

            const res = await request(app)
                .get(SELECT_DIRECTOR_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.hasText("h1", "Which director are you?"))
        })

        it("should render the select director page with members for LLDS01", async () => {
            dissolutionSession.officerType = OfficerType.MEMBER

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
                {...generateDirectorDetails(), id: DIRECTOR_1_ID},
                {...generateDirectorDetails(), id: DIRECTOR_2_ID}
            ])

            const app = createApp(container => {
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
            })

            const res = await request(app)
                .get(SELECT_DIRECTOR_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.hasText("h1", "Which member are you?"))
        })

        it("should prepopulate the select director page with the selected director from session", async () => {
            dissolutionSession.selectDirectorForm = generateSelectDirectorFormModel(DIRECTOR_2_ID)

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
                {...generateDirectorDetails(), id: DIRECTOR_1_ID},
                {...generateDirectorDetails(), id: DIRECTOR_2_ID}
            ])

            const app = createApp(container => {
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
            })

            const res = await request(app)
                .get(SELECT_DIRECTOR_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isFalse(htmlAssertHelper.hasAttribute("#select-director", "checked"))
            assert.isTrue(htmlAssertHelper.hasAttribute("#select-director-2", "checked"))
            assert.isFalse(htmlAssertHelper.hasAttribute("#select-director-4", "checked"))
        })

        it("should provide a full name input when a corporate director is selected", async () => {

            when(session.getDissolutionSession(anything())).thenReturn(aDissolutionSession().build())

            when(officerService.getActiveDirectorsForCompany(anything(), anything())).thenResolve([
                aDirectorDetails().withOfficerRole(OfficerRole.CORPORATE_DIRECTOR).build()
            ])

            const app = initApp()

            const res = await request(app)
                .get(SELECT_DIRECTOR_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.containsRawText("What is your full name?"))
            assert.isTrue(htmlAssertHelper.containsRawText("You must be authorised by this corporate director to sign the application on its behalf."))
        })
    })

    describe("POST - ensure form submission is handled correctly", () => {
        function initApp (): Application {
            return createApp(container => {
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(CompanyOfficersService).toConstantValue(instance(officerService))
                container.rebind(FormValidator).toConstantValue(instance(validator))
                container.rebind(DirectorToSignMapper).toConstantValue(new DirectorToSignMapper())
            })
        }

        beforeEach(() => when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession))

        it("should re-render the view with an error if validation fails", async () => {
            const form: SelectDirectorFormModel = generateSelectDirectorFormModel()
            const error: ValidationErrors = generateValidationError("director", "some director error")

            when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
                {...generateDirectorDetails(), id: DIRECTOR_1_ID},
                {...generateDirectorDetails(), id: DIRECTOR_2_ID}
            ])
            when(validator.validate(deepEqual(form), anything())).thenReturn(error)

            const app = initApp()

            const res = await request(app)
                .post(SELECT_DIRECTOR_URI)
                .send(form)
                .expect(StatusCodes.BAD_REQUEST)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.selectorExists(".govuk-error-summary"))
            assert.isTrue(htmlAssertHelper.containsText("#select-director-error", "some director error"))
        })

        describe("session", () => {

            it("should store the form in session if validation passes", async () => {
                const form: SelectDirectorFormModel = aSelectDirectorFormModel().withDirector(DIRECTOR_1_ID).withOnBehalfName(DIRECTOR_1_ID, "Authorised person").build()

                when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
                    {...generateDirectorDetails(), id: DIRECTOR_1_ID}
                ])
                when(validator.validate(deepEqual(form), deepEqual(selectDirectorSchema(dissolutionSession.officerType!)))).thenReturn(null)

                const app = initApp()

                await request(app)
                    .post(SELECT_DIRECTOR_URI)
                    .send(form)
                    .expect(StatusCodes.MOVED_TEMPORARILY)

                verify(session.setDissolutionSession(anything(), anything())).once()

                const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
                const updatedSession: DissolutionSession = sessionCaptor.last()[1]

                assert.deepEqual(updatedSession.selectDirectorForm, form)
            })

            describe("Applicant is a director", () => {

                it("should store the director details and email", async () => {
                    const directorName: string = "Some Director"
                    const directorEmail: string = "some@mail.com"

                    const form: SelectDirectorFormModel = generateSelectDirectorFormModel(DIRECTOR_1_ID)
                    const director: DirectorDetails = {
                        ...generateDirectorDetails(),
                        id: DIRECTOR_1_ID,
                        name: directorName
                    }

                    when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([director])
                    when(validator.validate(deepEqual(form), deepEqual(selectDirectorSchema(dissolutionSession.officerType!)))).thenReturn(null)
                    when(session.getUserEmail(anything())).thenReturn(directorEmail)

                    const app = initApp()

                    await request(app)
                        .post(SELECT_DIRECTOR_URI)
                        .send(form)
                        .expect(StatusCodes.MOVED_TEMPORARILY)

                    const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
                    const updatedSession: DissolutionSession = sessionCaptor.last()[1]

                    assert.isTrue(updatedSession.isApplicantADirector)
                    assert.isFalse(updatedSession.isMultiDirector)
                    assert.equal(updatedSession.directorsToSign!.length, 1)
                    assert.deepEqual(updatedSession.directorsToSign![0], {
                        "id": DIRECTOR_1_ID,
                        "name": directorName,
                        "officerRole": OfficerRole.DIRECTOR,
                        "email": directorEmail,
                        "isApplicant": true
                    })
                })

                it("should store the director details with an onBehalfName when corporate director selected", async () => {
                    const corporateDirectorName: string = "a-corporate-director-name"
                    const corporateDirectorId: string = "corporate-director-id"
                    const directorEmail: string = "some@mail.com"

                    const directors = [
                        aDirectorDetails().withId(corporateDirectorId).withName(corporateDirectorName).withOfficerRole(OfficerRole.CORPORATE_DIRECTOR).build()
                    ]

                    const form: SelectDirectorFormModel = aSelectDirectorFormModel().withDirector(corporateDirectorId).withOnBehalfName(corporateDirectorId, "Gus").build()

                    when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve(directors)
                    when(validator.validate(anything(), anything())).thenReturn(null)
                    when(session.getUserEmail(anything())).thenReturn(directorEmail)

                    await request(initApp())
                        .post(SELECT_DIRECTOR_URI)
                        .send(form)
                        .expect(StatusCodes.MOVED_TEMPORARILY)

                    const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
                    const updatedSession: DissolutionSession = sessionCaptor.last()[1]

                    assert.isTrue(updatedSession.isApplicantADirector)
                    assert.isFalse(updatedSession.isMultiDirector)
                    assert.equal(updatedSession.directorsToSign!.length, 1)
                    assert.deepEqual(updatedSession.directorsToSign![0], {
                        "id": corporateDirectorId,
                        "name": corporateDirectorName,
                        "officerRole": OfficerRole.CORPORATE_DIRECTOR,
                        "email": directorEmail,
                        "isApplicant": true,
                        "onBehalfName": "Gus"
                    })
                })
            })

            describe("Applicant is not a director", () => {

                it("should store the director details for a single director company", async () => {
                    const form: SelectDirectorFormModel = generateSelectDirectorFormModel(NOT_A_DIRECTOR_ID)

                    const director: DirectorDetails = {...generateDirectorDetails(), id: DIRECTOR_1_ID}

                    when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([director])
                    when(validator.validate(deepEqual(form), deepEqual(selectDirectorSchema(dissolutionSession.officerType!)))).thenReturn(null)

                    await request(initApp())
                        .post(SELECT_DIRECTOR_URI)
                        .send(form)
                        .expect(StatusCodes.MOVED_TEMPORARILY)

                    const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
                    const updatedSession: DissolutionSession = sessionCaptor.last()[1]

                    assert.isFalse(updatedSession.isApplicantADirector)
                    assert.isFalse(updatedSession.isMultiDirector)
                    assert.equal(updatedSession.directorsToSign!.length, 1)
                    assert.deepEqual(updatedSession.directorsToSign![0], {
                        "id": DIRECTOR_1_ID,
                        "isApplicant": false,
                        "name": "Some Director",
                        "officerRole": OfficerRole.DIRECTOR,
                    })
                })

                it("should not store the director details for a multi director company", async () => {
                    const form: SelectDirectorFormModel = generateSelectDirectorFormModel(NOT_A_DIRECTOR_ID)

                    when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
                        {...generateDirectorDetails(), id: DIRECTOR_1_ID},
                        {...generateDirectorDetails(), id: DIRECTOR_2_ID}
                    ])
                    when(validator.validate(deepEqual(form), deepEqual(selectDirectorSchema(dissolutionSession.officerType!)))).thenReturn(null)

                    const app = initApp()

                    await request(app)
                        .post(SELECT_DIRECTOR_URI)
                        .send(form)
                        .expect(StatusCodes.MOVED_TEMPORARILY)

                    verify(session.setDissolutionSession(anything(), anything())).once()

                    const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
                    const updatedSession: DissolutionSession = sessionCaptor.last()[1]

                    assert.isFalse(updatedSession.isApplicantADirector)
                    assert.isTrue(updatedSession.isMultiDirector)
                    assert.isEmpty(updatedSession.directorsToSign)
                })
            })
        })

        describe("redirect", () => {
            it("should redirect to check your answers if company is single director and director is selected", async () => {
                const form: SelectDirectorFormModel = generateSelectDirectorFormModel(DIRECTOR_1_ID)

                when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
                    {...generateDirectorDetails(), id: DIRECTOR_1_ID}
                ])
                when(validator.validate(deepEqual(form), deepEqual(selectDirectorSchema(dissolutionSession.officerType!)))).thenReturn(null)

                const app = initApp()

                await request(app)
                    .post(SELECT_DIRECTOR_URI)
                    .send(form)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", CHECK_YOUR_ANSWERS_URI)
            })

            it("should redirect to signatory info if company is single director and director is not selected", async () => {
                const form: SelectDirectorFormModel = generateSelectDirectorFormModel(NOT_A_DIRECTOR_ID)

                when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
                    {...generateDirectorDetails(), id: DIRECTOR_1_ID}
                ])
                when(validator.validate(deepEqual(form), deepEqual(selectDirectorSchema(dissolutionSession.officerType!)))).thenReturn(null)

                const app = initApp()

                await request(app)
                    .post(SELECT_DIRECTOR_URI)
                    .send(form)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", DEFINE_SIGNATORY_INFO_URI)
            })

            it("should redirect to select signatories if company is multi director and director is selected", async () => {
                const form: SelectDirectorFormModel = generateSelectDirectorFormModel(DIRECTOR_1_ID)

                when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
                    {...generateDirectorDetails(), id: DIRECTOR_1_ID},
                    {...generateDirectorDetails(), id: DIRECTOR_2_ID}
                ])
                when(validator.validate(deepEqual(form), deepEqual(selectDirectorSchema(dissolutionSession.officerType!)))).thenReturn(null)

                const app = initApp()

                await request(app)
                    .post(SELECT_DIRECTOR_URI)
                    .send(form)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", SELECT_SIGNATORIES_URI)
            })

            it("should redirect to select signatories if company is multi director and director is not selected", async () => {
                const form: SelectDirectorFormModel = generateSelectDirectorFormModel(NOT_A_DIRECTOR_ID)

                when(officerService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([
                    {...generateDirectorDetails(), id: DIRECTOR_1_ID},
                    {...generateDirectorDetails(), id: DIRECTOR_2_ID}
                ])
                when(validator.validate(deepEqual(form), deepEqual(selectDirectorSchema(dissolutionSession.officerType!)))).thenReturn(null)

                const app = initApp()

                await request(app)
                    .post(SELECT_DIRECTOR_URI)
                    .send(form)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", SELECT_SIGNATORIES_URI)
            })
        })
    })
})
