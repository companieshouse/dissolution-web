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
import DissolutionService from "app/services/dissolution/dissolution.service"
import IpAddressService from "app/services/ip-address/ipAddress.service"
import SessionService from "app/services/session/session.service"
import FormValidator from "app/utils/formValidator.util"

import { generateApprovalModel } from "test/fixtures/dissolutionApi.fixtures"
import { generateDissolutionSession } from "test/fixtures/session.fixtures"
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock"
import CompanyOfficersService from "app/services/company-officers/companyOfficers.service"

mockCsrfMiddleware.restore()

describe("EndorseCompanyClosureCertificateController", () => {

    let session: SessionService
    let mockedDissolutionService: DissolutionService
    let mockedFormValidator: FormValidator
    let mockedIpAddressService: IpAddressService
    let mockedCompanyOfficersService: any

    const EMAIL = "some-email.com"
    const COMPANY_NUMBER = "01777777"
    const IP_ADDRESS = "127.0.0.1"
    const COMPANY_NAME_LABEL = "Company name"
    const COMPANY_NUMBER_LABEL = "Company number"
    const COMPANY_NAME_VALUE = "Company 1"
    const COMPANY_NUMBER_VALUE = "123456789"
    const APPLICANT_NAME = "John Smith"
    const ON_BEHALF_NAME = "Jesse Smith"
    // Confirmation label constants
    const CONFIRMATION_LABEL_DIRECTOR = `I confirm that I am ${APPLICANT_NAME} and I am a director of ${COMPANY_NAME_VALUE}`
    const CONFIRMATION_LABEL_CORPORATE = `I confirm that I am  ${ON_BEHALF_NAME} and that I am authorised by ${COMPANY_NAME_VALUE} to sign this application on its behalf`
    const CONFIRMATION_LABEL_LLP_MEMBER = `I confirm that I am ${APPLICANT_NAME} and I am a member of ${COMPANY_NAME_VALUE}`
    // Error message constants for validation
    const CONFIRMATION_ERROR_NON_CORPORATE = "Confirm that you are the named director of this company"
    const CONFIRMATION_ERROR_CORPORATE = "Confirm that you are the named person and you are authorised to sign on the corporate director's behalf"
    const DECLARATION_ERROR = "Confirm that you are making the declaration"

    let dissolutionSession: DissolutionSession

    beforeEach(() => {
        session = mock(SessionService)
        mockedDissolutionService = mock(DissolutionService)
        mockedFormValidator = mock(FormValidator)
        mockedIpAddressService = mock(IpAddressService)
        mockedCompanyOfficersService = mock({ isCorporateOfficer: async () => false })

        dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
        dissolutionSession.approval = generateApprovalModel({
            companyName: COMPANY_NAME_VALUE,
            companyNumber: COMPANY_NUMBER_VALUE,
            applicant: APPLICANT_NAME,
            officerId: "abc123",
            officerType: OfficerType.DIRECTOR,
            isCorporateOfficer: false
        })

        when(session.getAccessToken(anything())).thenReturn(TOKEN)
        when(session.getUserEmail(anything())).thenReturn(EMAIL)
        when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
        // Default: not a corporate officer
        mockedCompanyOfficersService.isCorporateOfficer = async () => false
    })

    describe("GET request", () => {
        it("should render endorse certificate page without an on behalf statement if director is signing and not a corporate officer", async () => {
            mockedCompanyOfficersService.isCorporateOfficer = async () => false
            if (!dissolutionSession.approval) {
                dissolutionSession.approval = generateApprovalModel({
                    companyName: COMPANY_NAME_VALUE,
                    companyNumber: COMPANY_NUMBER_VALUE,
                    applicant: APPLICANT_NAME,
                    officerId: "abc123",
                    officerType: OfficerType.DIRECTOR,
                    isCorporateOfficer: false
                })
            } else {
                dissolutionSession.approval.isCorporateOfficer = false
            }
            const app = createApp(container => {
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(CompanyOfficersService).toConstantValue(mockedCompanyOfficersService)
            })

            const res = await request(app)
                .get(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            assert.isTrue(htmlAssertHelper.hasText("span#confirmationLabel", CONFIRMATION_LABEL_DIRECTOR))
            assert.isTrue(htmlAssertHelper.containsRawText(COMPANY_NAME_LABEL))
            assert.isTrue(htmlAssertHelper.containsRawText(COMPANY_NAME_VALUE))
            assert.isTrue(htmlAssertHelper.containsRawText(COMPANY_NUMBER_LABEL))
            assert.isTrue(htmlAssertHelper.containsRawText(COMPANY_NUMBER_VALUE))
            assert.isTrue(htmlAssertHelper.hasText("span#applicantName", APPLICANT_NAME))
            // Confirmation label for non-corporate officer
            assert.isTrue(htmlAssertHelper.hasText("span#confirmationLabel", CONFIRMATION_LABEL_DIRECTOR))
            assert.equal(htmlAssertHelper.getAttributeValue(".govuk-back-link", "href"), `${VIEW_COMPANY_INFORMATION_URI}?companyNumber=${dissolutionSession.approval!.companyNumber}`)
        })

        it("should render both confirmation and declaration checkboxes and new headings", async () => {
            mockedCompanyOfficersService.isCorporateOfficer = async () => false
            const app = createApp(container => {
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(CompanyOfficersService).toConstantValue(mockedCompanyOfficersService)
            })

            const res = await request(app)
                .get(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
                .expect(StatusCodes.OK)

            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            // Check for confirmation checkbox
            assert.isTrue(htmlAssertHelper.selectorExists('input[name="confirmation"]'))
            // Check for declaration checkbox
            assert.isTrue(htmlAssertHelper.selectorExists('input[name="declaration"]'))
            // Check for tickboxes heading (exact match, any <h2> tag)
            assert.isTrue(htmlAssertHelper.anyTagHasText("h2", "By ticking both of the boxes below you are signing the application."), "Expected to find the correct tickboxes heading in an <h2> tag");
            // Check for declaration heading
            assert.isTrue(htmlAssertHelper.hasText("#declaration-heading", "Declaration"))
        })

        it("should render endorse certificate page with corporate officer confirmation label", async () => {
            mockedCompanyOfficersService.isCorporateOfficer = async () => true
            if (!dissolutionSession.approval) {
                dissolutionSession.approval = generateApprovalModel()
            }
            dissolutionSession.approval.isCorporateOfficer = true
            dissolutionSession.approval.onBehalfName = ON_BEHALF_NAME
            const app = createApp(async container => {
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(CompanyOfficersService).toConstantValue(mockedCompanyOfficersService)
                const res = await request(app)
                    .get(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
                    .expect(StatusCodes.OK)

                const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
                // Confirmation label for corporate officer
                assert.isTrue(htmlAssertHelper.hasText("span#confirmationLabel", CONFIRMATION_LABEL_CORPORATE))
            })

            // Removed test: a director can never have a signatory

            it("should render endorse certificate page with directors for DS01", async () => {
                dissolutionSession.approval!.officerType = OfficerType.DIRECTOR

                const app = createApp(container => {
                    container.rebind(SessionService).toConstantValue(instance(session))
                    container.rebind(CompanyOfficersService).toConstantValue(mockedCompanyOfficersService)
                })

                const res = await request(app)
                    .get(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
                    .expect(StatusCodes.OK)

                const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

                // The template uses 'company' (lowercase) and 'directors' for DS01
                assert.isTrue(htmlAssertHelper.containsText("#paragraph-statement", "company"))
                assert.isTrue(htmlAssertHelper.hasText("#declaration-heading", "Declaration"))
                assert.isTrue(htmlAssertHelper.containsText("#declaration-paragraph", "director"))
                assert.isTrue(htmlAssertHelper.containsText("#declaration-paragraph", "company"))
                assert.isFalse(htmlAssertHelper.containsText("#declaration-paragraph", "LLP"))
                assert.isFalse(htmlAssertHelper.containsText("#declaration-paragraph", "member"))
            })

            it("should render endorse certificate page with members for LLDS01", async () => {
                dissolutionSession.approval!.officerType = OfficerType.MEMBER

                const app = createApp(container => {
                    container.rebind(SessionService).toConstantValue(instance(session))
                    container.rebind(CompanyOfficersService).toConstantValue(mockedCompanyOfficersService)
                })

                const res = await request(app)
                    .get(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
                    .expect(StatusCodes.OK)

                const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

                assert.isTrue(htmlAssertHelper.hasText("span#confirmationLabel", CONFIRMATION_LABEL_LLP_MEMBER), "Expected confirmation label for LLP member")
                assert.isTrue(htmlAssertHelper.hasText("#declaration-heading", "Declaration"))
                assert.isTrue(htmlAssertHelper.containsText("#declaration-paragraph", "member"))
                assert.isTrue(htmlAssertHelper.containsText("#declaration-paragraph", "LLP"))
                assert.isFalse(htmlAssertHelper.containsText("#declaration-paragraph", "company"))
                assert.isFalse(htmlAssertHelper.containsText("#declaration-paragraph", "director"))
                // Confirmation label for LLP member
                assert.isTrue(htmlAssertHelper.hasText("span#confirmationLabel", CONFIRMATION_LABEL_LLP_MEMBER), "Expected confirmation label for LLP member")
            })
        })

        describe("POST - ensure form submission is handled correctly", () => {
            it("should redirect successfully if validator returns no errors (non-corporate officer)", async () => {
                const testObject = generateEndorseCertificateFormModel()
                mockedCompanyOfficersService.isCorporateOfficer = async () => false
                if (!dissolutionSession.approval) {
                    dissolutionSession.approval = generateApprovalModel()
                }
                dissolutionSession.approval.isCorporateOfficer = false

                when(mockedIpAddressService.getIpAddress(anything())).thenReturn(IP_ADDRESS)
                when(mockedDissolutionService.approveDissolution(anything(), anything(), IP_ADDRESS)).thenResolve()
                // Dynamic validation schema
                when(mockedFormValidator.validate(deepEqual(testObject), anything())).thenReturn(null)
                when(mockedIpAddressService.getIpAddress(anything())).thenReturn(IP_ADDRESS)

                const app = createApp(container => {
                    container.rebind(FormValidator).toConstantValue(instance(mockedFormValidator))
                    container.rebind(SessionService).toConstantValue(instance(session))
                    container.rebind(DissolutionService).toConstantValue(instance(mockedDissolutionService))
                    container.rebind(IpAddressService).toConstantValue(instance(mockedIpAddressService))
                    container.rebind(CompanyOfficersService).toConstantValue(mockedCompanyOfficersService)
                })

                await request(app).post(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
                    .send(testObject)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", REDIRECT_GATE_URI)
            })
        })

        it("should redirect successfully if validator returns no errors (corporate officer)", async () => {
            const testObject = generateEndorseCertificateFormModel()
            mockedCompanyOfficersService.isCorporateOfficer = async () => true
            if (!dissolutionSession.approval) {
                dissolutionSession.approval = generateApprovalModel()
            }
            dissolutionSession.approval.isCorporateOfficer = true

            when(mockedIpAddressService.getIpAddress(anything())).thenReturn(IP_ADDRESS)
            when(mockedDissolutionService.approveDissolution(anything(), anything(), IP_ADDRESS)).thenResolve()
            // Dynamic validation schema
            when(mockedFormValidator.validate(deepEqual(testObject), anything())).thenReturn(null)
            when(mockedIpAddressService.getIpAddress(anything())).thenReturn(IP_ADDRESS)

            const app = createApp(container => {
                container.rebind(FormValidator).toConstantValue(instance(mockedFormValidator))
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(DissolutionService).toConstantValue(instance(mockedDissolutionService))
                container.rebind(IpAddressService).toConstantValue(instance(mockedIpAddressService))
                container.rebind(CompanyOfficersService).toConstantValue(mockedCompanyOfficersService)
            })

            await request(app).post(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
                .send(testObject)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", REDIRECT_GATE_URI)
        })

        it("should render view with errors displayed if validator returns errors (corporate officer)", async () => {
            const testObject: EndorseCertificateFormModel = { confirmation: "understood", declaration: "declared" }
            const mockError = generateValidationError("confirmation", CONFIRMATION_ERROR_CORPORATE)
            mockedCompanyOfficersService.isCorporateOfficer = async () => true
            if (!dissolutionSession.approval) {
                dissolutionSession.approval = generateApprovalModel()
            }
            dissolutionSession.approval.isCorporateOfficer = true

            when(mockedDissolutionService.approveDissolution(TOKEN, anything(), anything())).thenResolve()
            // Dynamic validation schema
            when(mockedFormValidator.validate(deepEqual(testObject), anything())).thenReturn(mockError)

            const app = createApp(container => {
                container.rebind(FormValidator).toConstantValue(instance(mockedFormValidator))
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(CompanyOfficersService).toConstantValue(mockedCompanyOfficersService)
            })

            const res = await request(app).post(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI).send(testObject).expect(StatusCodes.BAD_REQUEST)
            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            assert.isTrue(htmlAssertHelper.selectorExists(".govuk-error-summary"))
            // Check for corporate officer error message (HTML-encoded apostrophe)
            const encodedError = CONFIRMATION_ERROR_CORPORATE.replace(/'/g, "&#39;")
            assert.isTrue(res.text.includes(encodedError))
        })

        it("should render view with errors displayed if declaration is missing", async () => {
            const testObject: EndorseCertificateFormModel = { confirmation: "understood" }
            const mockError = generateValidationError("declaration", DECLARATION_ERROR)
            mockedCompanyOfficersService.isCorporateOfficer = async () => false
            if (!dissolutionSession.approval) {
                dissolutionSession.approval = generateApprovalModel()
            }
            dissolutionSession.approval.isCorporateOfficer = false

            when(mockedDissolutionService.approveDissolution(TOKEN, anything(), anything())).thenResolve()
            when(mockedFormValidator.validate(deepEqual(testObject), anything())).thenReturn(mockError)

            const app = createApp(container => {
                container.rebind(FormValidator).toConstantValue(instance(mockedFormValidator))
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind("CompanyOfficersService").toConstantValue(mockedCompanyOfficersService)
            })

            const res = await request(app).post(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI).send(testObject).expect(StatusCodes.BAD_REQUEST)
            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            assert.isTrue(htmlAssertHelper.selectorExists(".govuk-error-summary"))
            assert.isTrue(res.text.includes(DECLARATION_ERROR))
        })

        it("should render view with errors displayed if both confirmation and declaration are missing", async () => {
            const testObject: EndorseCertificateFormModel = {}
            const mockError = {
                confirmation: CONFIRMATION_ERROR_NON_CORPORATE,
                declaration: DECLARATION_ERROR
            }
            mockedCompanyOfficersService.isCorporateOfficer = async () => false
            if (!dissolutionSession.approval) {
                dissolutionSession.approval = generateApprovalModel()
            }
            dissolutionSession.approval.isCorporateOfficer = false

            when(mockedDissolutionService.approveDissolution(TOKEN, anything(), anything())).thenResolve()
            when(mockedFormValidator.validate(deepEqual(testObject), anything())).thenReturn(mockError)

            const app = createApp(container => {
                container.rebind(FormValidator).toConstantValue(instance(mockedFormValidator))
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind("CompanyOfficersService").toConstantValue(mockedCompanyOfficersService)
            })

            const res = await request(app).post(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI).send(testObject).expect(StatusCodes.BAD_REQUEST)
            const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)
            assert.isTrue(htmlAssertHelper.selectorExists(".govuk-error-summary"))
            assert.isTrue(res.text.includes(CONFIRMATION_ERROR_NON_CORPORATE))
            assert.isTrue(res.text.includes(DECLARATION_ERROR))
        })
    })
})
