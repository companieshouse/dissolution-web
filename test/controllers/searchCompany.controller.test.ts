import "reflect-metadata"

import { assert } from "chai"
import { Request } from "express"
import { StatusCodes } from "http-status-codes"
import request from "supertest"
import { anything, capture, deepEqual, instance, mock, verify, when } from "ts-mockito"
import { ArgCaptor2 } from "ts-mockito/lib/capture/ArgCaptor"
import { generateSearchCompanyForm } from "../fixtures/companyProfile.fixtures"
import { generateValidationError } from "../fixtures/error.fixtures"
import { TOKEN } from "../fixtures/session.fixtures"
import { createApp } from "./helpers/application.factory"
import HtmlAssertHelper from "./helpers/htmlAssert.helper"

import "app/controllers/searchCompany.controller"
import SearchCompanyFormModel from "app/models/form/searchCompany.model"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import ValidationErrors from "app/models/view/validationErrors.model"
import { SEARCH_COMPANY_URI, VIEW_COMPANY_INFORMATION_URI } from "app/paths"
import searchCompanySchema from "app/schemas/searchCompany.schema"
import CompanyService from "app/services/company/company.service"
import SessionService from "app/services/session/session.service"
import CompanyNumberSanitizer from "app/utils/companyNumberSanitizer"
import FormValidator from "app/utils/formValidator.util"

describe("SearchCompanyController", () => {

    let validator: FormValidator
    let companyService: CompanyService
    let sanitizer: CompanyNumberSanitizer
    let session: SessionService

    beforeEach(() => {
        validator = mock(FormValidator)
        companyService = mock(CompanyService)
        session = mock(SessionService)
        sanitizer = mock(CompanyNumberSanitizer)

        when(session.getAccessToken(anything())).thenReturn(TOKEN)
    })

    describe("GET request", () => {
        it("should render the search company page", async () => {
            const app = createApp()

            const res = await request(app)
                .get(SEARCH_COMPANY_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.hasText("h1", "What is the company number?"))
        })
    })

    describe("POST request", () => {
        const companyNumber: string = "1234"
        const form: SearchCompanyFormModel = generateSearchCompanyForm(companyNumber)

        it("should re-render the view with an error if validation fails", async () => {
            const error: ValidationErrors = generateValidationError("companyNumber", "Some company number error")

            when(validator.validate(deepEqual(form), searchCompanySchema)).thenReturn(error)
            when(sanitizer.sanitizeCompany(companyNumber)).thenReturn(companyNumber)

            const app = createApp(container => {
                container.rebind(FormValidator).toConstantValue(instance(validator))
                container.rebind(CompanyNumberSanitizer).toConstantValue(instance(sanitizer))
            })

            const res = await request(app)
                .post(SEARCH_COMPANY_URI)
                .send(form)
                .expect(StatusCodes.BAD_REQUEST)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.hasText("h1", "What is the company number?"))
            assert.isTrue(htmlAssertHelper.selectorExists(".govuk-error-summary"))
            assert.isTrue(htmlAssertHelper.containsText("#company-number-error", "Some company number error"))
        })

        it("should re-render the view with an error if validation passes but company does not exist", async () => {
            when(validator.validate(deepEqual(form), searchCompanySchema)).thenReturn(null)
            when(companyService.doesCompanyExist(TOKEN, companyNumber)).thenResolve(false)
            when(sanitizer.sanitizeCompany(companyNumber)).thenReturn(companyNumber)

            const app = createApp(container => {
                container.rebind(FormValidator).toConstantValue(instance(validator))
                container.rebind(CompanyService).toConstantValue(instance(companyService))
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(CompanyNumberSanitizer).toConstantValue(instance(sanitizer))
            })

            const res = await request(app)
                .post(SEARCH_COMPANY_URI)
                .send(form)
                .expect(StatusCodes.BAD_REQUEST)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

            assert.isTrue(htmlAssertHelper.hasText("h1", "What is the company number?"))
            assert.isTrue(htmlAssertHelper.selectorExists(".govuk-error-summary"))
            assert.isTrue(htmlAssertHelper.containsText("#company-number-error", "Company number does not exist or is incorrect"))
        })

        it("should save the company number in session if company exists", async () => {
            when(validator.validate(deepEqual(form), searchCompanySchema)).thenReturn(null)
            when(companyService.doesCompanyExist(TOKEN, companyNumber)).thenResolve(true)
            when(sanitizer.sanitizeCompany(companyNumber)).thenReturn(companyNumber)

            const app = createApp(container => {
                container.rebind(FormValidator).toConstantValue(instance(validator))
                container.rebind(CompanyService).toConstantValue(instance(companyService))
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(CompanyNumberSanitizer).toConstantValue(instance(sanitizer))
            })

            await request(app)
                .post(SEARCH_COMPANY_URI)
                .send(form)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", VIEW_COMPANY_INFORMATION_URI)

            verify(session.setDissolutionSession(anything(), anything())).once()

            const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
            const updatedSession: DissolutionSession = sessionCaptor.last()[1]

            assert.deepEqual(updatedSession.companyNumber, companyNumber)
        })

        it("should redirect if validator returns no errors and company exists", async () => {
            when(validator.validate(deepEqual(form), searchCompanySchema)).thenReturn(null)
            when(companyService.doesCompanyExist(TOKEN, companyNumber)).thenResolve(true)
            when(sanitizer.sanitizeCompany(companyNumber)).thenReturn(companyNumber)

            const app = createApp(container => {
                container.rebind(FormValidator).toConstantValue(instance(validator))
                container.rebind(CompanyService).toConstantValue(instance(companyService))
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(CompanyNumberSanitizer).toConstantValue(instance(sanitizer))
            })

            await request(app)
                .post(SEARCH_COMPANY_URI)
                .send(form)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", VIEW_COMPANY_INFORMATION_URI)
        })
    })
})
