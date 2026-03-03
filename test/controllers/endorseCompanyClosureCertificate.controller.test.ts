import "reflect-metadata"

import { assert } from "chai"
import { StatusCodes } from "http-status-codes"
import request from "supertest"
import { anything, deepEqual, instance, mock, when } from "ts-mockito"
import { generateEndorseCertificateFormModel } from "../fixtures/endorseCertificateFormModel.fixtures"
import { generateValidationError } from "../fixtures/error.fixtures"
import { TOKEN } from "../fixtures/session.fixtures"
import { createApp } from "./helpers/application.factory"
import HtmlAssertHelper from "./helpers/htmlAssert.helper"

import "app/controllers/endorseCompanyClosureCertificate.controller"
import OfficerType from "app/models/dto/officerType.enum"
import EndorseCertificateFormModel from "app/models/form/endorseCertificateFormModel"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import { ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI, REDIRECT_GATE_URI, VIEW_COMPANY_INFORMATION_URI } from "app/paths"
import formSchema from "app/schemas/endorseCertificate.schema"
import DissolutionService from "app/services/dissolution/dissolution.service"
import IpAddressService from "app/services/ip-address/ipAddress.service"
import SessionService from "app/services/session/session.service"
import FormValidator from "app/utils/formValidator.util"

import { generateApprovalModel } from "test/fixtures/dissolutionApi.fixtures"
import { generateDissolutionSession } from "test/fixtures/session.fixtures"
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock"

mockCsrfMiddleware.restore()

describe("EndorseCompanyClosureCertificateController", () => {

    let session: SessionService
    let mockedDissolutionService: DissolutionService
    let mockedFormValidator: FormValidator
    let mockedIpAddressService: IpAddressService

    const EMAIL = "some-email.com"
    const COMPANY_NUMBER = "01777777"
    const IP_ADDRESS = "127.0.0.1"
    const SIGN_HEADING = "Sign the application"
    const COMPANY_NAME_LABEL = "Company name"
    const COMPANY_NUMBER_LABEL = "Company number"
    const COMPANY_NAME_VALUE = "Company 1"
    const COMPANY_NUMBER_VALUE = "123456789"
    const CONFIRMATION_PREFIX = "I confirm I have read and understood the statements - signed "
    const APPLICANT_NAME = "John Smith"
    const ON_BEHALF_NAME = "Jesse Smith"

    let dissolutionSession: DissolutionSession

    beforeEach(() => {
        session = mock(SessionService)
        mockedDissolutionService = mock(DissolutionService)
        mockedFormValidator = mock(FormValidator)
        mockedIpAddressService = mock(IpAddressService)

        dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
        dissolutionSession.approval = generateApprovalModel()
        dissolutionSession.approval.companyName = COMPANY_NAME_VALUE
        dissolutionSession.approval.companyNumber = COMPANY_NUMBER_VALUE
        dissolutionSession.approval.applicant = APPLICANT_NAME

        when(session.getAccessToken(anything())).thenReturn(TOKEN)
        when(session.getUserEmail(anything())).thenReturn(EMAIL)
        when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
    })

    describe("GET request", () => {
        it("should render endorse certificate page without an on behalf statement if director is signing", async () => {
            const app = createApp(container => {
                container.rebind(SessionService).toConstantValue(instance(session))
            })

            const res = await request(app)
                .get(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            const dateString = new Date().toDateString()

            assert.isTrue(htmlAssertHelper.hasText("h1", SIGN_HEADING))
            assert.isTrue(htmlAssertHelper.containsRawText(COMPANY_NAME_LABEL))
            assert.isTrue(htmlAssertHelper.containsRawText(COMPANY_NAME_VALUE))
            assert.isTrue(htmlAssertHelper.containsRawText(COMPANY_NUMBER_LABEL))
            assert.isTrue(htmlAssertHelper.containsRawText(COMPANY_NUMBER_VALUE))
            assert.isTrue(htmlAssertHelper.hasText("span#applicantName", APPLICANT_NAME))
            assert.isTrue(htmlAssertHelper.hasText("span#confirmationLabel", CONFIRMATION_PREFIX + APPLICANT_NAME + " on " + dateString))
            assert.equal(htmlAssertHelper.getAttributeValue(".govuk-back-link", "href"), `${VIEW_COMPANY_INFORMATION_URI}?companyNumber=${dissolutionSession.approval!.companyNumber}`)
        })

        it("should render endorse certificate page with an on behalf statement if director has a signatory", async () => {
            dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
            dissolutionSession.approval = generateApprovalModel()
            dissolutionSession.approval.companyName = COMPANY_NAME_VALUE
            dissolutionSession.approval.companyNumber = COMPANY_NUMBER_VALUE
            dissolutionSession.approval.applicant = APPLICANT_NAME
            dissolutionSession.approval.onBehalfName = ON_BEHALF_NAME

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

            const app = createApp(container => {
                container.rebind(SessionService).toConstantValue(instance(session))
            })

            const res = await request(app)
                .get(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            const dateString = new Date().toDateString()

            assert.isTrue(htmlAssertHelper.hasText("h1", SIGN_HEADING))
            assert.isTrue(htmlAssertHelper.containsRawText(COMPANY_NAME_LABEL))
            assert.isTrue(htmlAssertHelper.containsRawText(COMPANY_NAME_VALUE))
            assert.isTrue(htmlAssertHelper.containsRawText(COMPANY_NUMBER_LABEL))
            assert.isTrue(htmlAssertHelper.containsRawText(COMPANY_NUMBER_VALUE))
            assert.isTrue(htmlAssertHelper.hasText("span#applicantName", ON_BEHALF_NAME))
            assert.isTrue(htmlAssertHelper.hasText("span#confirmationLabel", CONFIRMATION_PREFIX + ON_BEHALF_NAME + " on " + dateString + " on behalf of " + APPLICANT_NAME))
            assert.equal(htmlAssertHelper.getAttributeValue(".govuk-back-link", "href"), `${VIEW_COMPANY_INFORMATION_URI}?companyNumber=${dissolutionSession.approval!.companyNumber}`)
        })

        it("should render endorse certificate page with directors for DS01", async () => {
      dissolutionSession.approval!.officerType = OfficerType.DIRECTOR

      const app = createApp(container => {
          container.rebind(SessionService).toConstantValue(instance(session))
      })

      const res = await request(app)
          .get(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
          .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.containsText("#paragraph-statement", "company"))
      assert.isTrue(htmlAssertHelper.hasText("#declaration-heading", "Declaration of directors"))
      assert.isTrue(htmlAssertHelper.containsText("#declaration-paragraph", "directors"))
      assert.isTrue(htmlAssertHelper.containsText("#declaration-paragraph", "company"))
      assert.isFalse(htmlAssertHelper.containsText("#declaration-paragraph", "LLP"))
      assert.isFalse(htmlAssertHelper.containsText("#declaration-paragraph", "members"))
        })

        it("should render endorse certificate page with members for LLDS01", async () => {
      dissolutionSession.approval!.officerType = OfficerType.MEMBER

      const app = createApp(container => {
          container.rebind(SessionService).toConstantValue(instance(session))
      })

      const res = await request(app)
          .get(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
          .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.containsText("#paragraph-statement", "LLP"))
      assert.isTrue(htmlAssertHelper.hasText("#declaration-heading", "Declaration of members"))
      assert.isTrue(htmlAssertHelper.containsText("#declaration-paragraph", "members"))
      assert.isTrue(htmlAssertHelper.containsText("#declaration-paragraph", "LLP"))
      assert.isFalse(htmlAssertHelper.containsText("#declaration-paragraph", "company"))
      assert.isFalse(htmlAssertHelper.containsText("#declaration-paragraph", "directors"))
        })
    })

    describe("POST - ensure form submission is handled correctly", () => {
        it("should redirect successfully if validator returns no errors", async () => {
            const testObject = generateEndorseCertificateFormModel()

            when(mockedIpAddressService.getIpAddress(anything())).thenReturn(IP_ADDRESS)
            when(mockedDissolutionService.approveDissolution(anything(), anything(), IP_ADDRESS)).thenResolve()
            when(mockedFormValidator.validate(deepEqual(testObject), formSchema)).thenReturn(null)
            when(mockedIpAddressService.getIpAddress(anything())).thenReturn(IP_ADDRESS)

            const app = createApp(container => {
                container.rebind(FormValidator).toConstantValue(instance(mockedFormValidator))
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(DissolutionService).toConstantValue(instance(mockedDissolutionService))
                container.rebind(IpAddressService).toConstantValue(instance(mockedIpAddressService))
            })

            await request(app).post(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
                .send(testObject)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", REDIRECT_GATE_URI)
        })

        it("should render view with errors displayed if validator returns errors", async () => {
            const testObject: EndorseCertificateFormModel = { confirmation: "understood" }
            const mockError = generateValidationError("confirmation", "Test confirmation error")

            when(mockedDissolutionService.approveDissolution(TOKEN, anything(), anything())).thenResolve()
            when(mockedFormValidator.validate(deepEqual(testObject), formSchema)).thenReturn(mockError)

            const app = createApp(container => {
                container.rebind(FormValidator).toConstantValue(instance(mockedFormValidator))
                container.rebind(SessionService).toConstantValue(instance(session))
            })

            const res = await request(app).post(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI).send(testObject).expect(StatusCodes.BAD_REQUEST)
            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            assert.isTrue(htmlAssertHelper.selectorExists(".govuk-error-summary"))
        })
    })
})
