import "reflect-metadata"
import request from "supertest"
import "app/controllers/bootstrapJourney.controller"
import { anything, instance, mock, when, verify, capture } from "ts-mockito"
import { assert } from "chai"
import CompanyAuthService from "app/services/auth/companyAuth.service"
import SessionService from "app/services/session/session.service"
import UuidGenerator from "app/utils/uuidGenerator"
import { VIEW_COMPANY_INFORMATION_URI, BOOTSTRAP_JOURNEY_URI } from "app/paths"
import JourneyPathService from "app/services/session/journeyPath.service"
import { createApp } from "test/controllers/helpers/application.factory"
import TYPES from "app/types"


describe("BootstrapJourneyController", () => {
    let sessionServiceMock: SessionService
    let uuidGeneratorMock: UuidGenerator
    let companyAuthServiceMock: any
    let app: any

    beforeEach(() => {
        sessionServiceMock = mock(SessionService)
        uuidGeneratorMock = mock(UuidGenerator)
        companyAuthServiceMock = mock(CompanyAuthService)

        app = createApp(container => {
            container.rebind(SessionService).toConstantValue(instance(sessionServiceMock))
            container.rebind(TYPES.UuidGenerator).toConstantValue(instance(uuidGeneratorMock))
            container.rebind(CompanyAuthService).toConstantValue(instance(companyAuthServiceMock))
            container.rebind(JourneyPathService).toConstantValue({
                journeyPath: (_req: any, pathTemplate: string, options?: any) => {
                    if (options && options.journeyId) {
                        return pathTemplate.replace(":journeyId", options.journeyId)
                    }
                    return pathTemplate
                }
            } as any)
        })
    })

    it("when authenticated user is NOT authorised for requested company then redirects to account auth", async () => {
        const companyNumber = "88888888"

        when(companyAuthServiceMock.isAuthorisedForCompany(anything(), anything())).thenReturn(false)
        when(companyAuthServiceMock.getAuthRedirectUri(anything(), anything())).thenReturn(Promise.resolve("http://account.chs-dev/oauth2/authorise?state=encoded"))

        const res = await request(app)
            .get(BOOTSTRAP_JOURNEY_URI)
            .query({ companyNumber })

        assert.equal(res.status, 302)
        assert.equal(res.headers.location, "http://account.chs-dev/oauth2/authorise?state=encoded")

        verify(sessionServiceMock.initDissolutionSession(anything(), anything(), anything())).never()
        verify(companyAuthServiceMock.getAuthRedirectUri(anything(), anything())).once()
    })

    it("when authenticated user IS authorised for company then dissolution session initialized and redirect", async () => {
        const companyNumber = "12345678"
        const journeyId = "e1101f0a-5121-4429-acee-a817c5cAAAAA"

        when(companyAuthServiceMock.isAuthorisedForCompany(anything(), anything())).thenReturn(true)
        when(uuidGeneratorMock.generate()).thenReturn(journeyId)

        const res = await request(app)
            .get(BOOTSTRAP_JOURNEY_URI)
            .query({ companyNumber })

        assert.equal(res.status, 302)
        assert.equal(res.headers.location, VIEW_COMPANY_INFORMATION_URI.replace(":journeyId", journeyId))

        verify(sessionServiceMock.initDissolutionSession(anything(), anything(), anything())).once()
        const [, savedJourneyId, savedCompanyNumber] = capture(sessionServiceMock.initDissolutionSession).last()
        assert.equal(savedJourneyId, journeyId)
        assert.equal(savedCompanyNumber, companyNumber)
    })

    const invalidCompanyNumberCases = [
        { desc: "undefined input", input: undefined },
        { desc: "empty string", input: "" },
        { desc: "spaces only", input: "   " },
        { desc: "array with empty", input: [""] },
    ]

    invalidCompanyNumberCases.forEach((tc) => {
        it(`applicationNumber invalid: ${tc.desc}`, async () => {

            when(uuidGeneratorMock.generate()).thenReturn("should-not-be-used")
            const res = await request(app)
                .get(BOOTSTRAP_JOURNEY_URI)
                .query({ companyNumber: tc.input })

            assert.equal(res.status, 500)
            void verify(sessionServiceMock.initDissolutionSession(anything(), anything(), anything())).never()
        })
    })

    const validCompanyNumberCases = [
        { desc: "array with valid first element", input: [" 12345 "], expected: "12345" },
        { desc: "valid simple", input: "12345678", expected: "12345678" },
        { desc: "valid trimmed", input: " abc123 ", expected: "abc123" }
    ]

    validCompanyNumberCases.forEach((tc) => {
        it(`applicationNumber valid: ${tc.desc}`, async () => {

            when(companyAuthServiceMock.isAuthorisedForCompany(anything(), anything())).thenReturn(true)
            when(uuidGeneratorMock.generate()).thenReturn("e1101f0a-5121-4429-acee-a817c5cAAAAA")

            const res = await request(app)
                .get(BOOTSTRAP_JOURNEY_URI)
                .query({ companyNumber: tc.input })

            assert.equal(res.status, 302)
            assert.equal(res.headers.location, VIEW_COMPANY_INFORMATION_URI.replace(":journeyId", "e1101f0a-5121-4429-acee-a817c5cAAAAA"))
            verify(sessionServiceMock.initDissolutionSession(anything(), anything(), anything())).once()
            const [, , savedCompanyNumber] = capture(sessionServiceMock.initDissolutionSession).last()
            assert.equal(savedCompanyNumber, tc.expected)
        })
    })
})
