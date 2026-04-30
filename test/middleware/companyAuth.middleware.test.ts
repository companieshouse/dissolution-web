import "reflect-metadata"

import { Session } from "@companieshouse/node-session-handler"
import { ISignInInfo } from "@companieshouse/node-session-handler/lib/session/model/SessionInterfaces"
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger"
import { assert } from "chai"
import { RequestHandler, Response } from "express"
import sinon from "sinon"
import { anything, instance, mock, when, verify } from "ts-mockito"

import CompanyAuthMiddleware from "app/middleware/companyAuth.middleware"
import SessionService from "app/services/session/session.service"
import CompanyAuthService from "app/services/auth/companyAuth.service"
import {
    ACCESSIBILITY_STATEMENT_URI,
    HEALTHCHECK_URI,
    ROOT_URI,
    SEARCH_COMPANY_URI,
    STOP_SCREEN_BANK_ACCOUNT_URI,
    WHO_TO_TELL_URI,
    BOOTSTRAP_JOURNEY_URI, SELECT_DIRECTOR_URI, JOURNEY_PATH_PREFIX, VIEW_COMPANY_INFORMATION_URI,
    SELECT_SIGNATORIES_URI, DEFINE_SIGNATORY_INFO_URI, CHECK_YOUR_ANSWERS_URI
} from "app/paths"

import { generateSession } from "test/fixtures/session.fixtures"


describe("AuthMiddleware", () => {

    let middleware: RequestHandler

    let companyAuthService: CompanyAuthService
    let sessionService: SessionService
    let logger: ApplicationLogger
    let session: Session

    beforeEach(() => {
        companyAuthService = mock(CompanyAuthService)
        sessionService = mock(SessionService)
        logger = mock(ApplicationLogger)
        session = generateSession()

        when(sessionService.getSession(anything())).thenReturn(session)
        when(companyAuthService.isAuthorisedForCompany(anything(), anything())).thenReturn(false)
        when(companyAuthService.getAuthRedirectUri(anything(), anything())).thenResolve("http://account.chs-dev/oauth2/authorise?client_id=123456.gov.uk&redirect_uri=http://chs-dev/oauth2/user/callback&response_type=code&scope=https://account.companieshouse.gov.uk/user.write-full https://api.companieshouse.gov.uk/company/12345678")

        middleware = CompanyAuthMiddleware(
            instance(companyAuthService), instance(sessionService), logger
        )
    })

    const whitelistedUrls = [
        ROOT_URI,
        `${ROOT_URI}/`,
        WHO_TO_TELL_URI,
        `${WHO_TO_TELL_URI}/`,
        HEALTHCHECK_URI,
        `${HEALTHCHECK_URI}/`,
        SEARCH_COMPANY_URI,
        STOP_SCREEN_BANK_ACCOUNT_URI,
        `${SEARCH_COMPANY_URI}/`,
        ACCESSIBILITY_STATEMENT_URI,
        `${ACCESSIBILITY_STATEMENT_URI}/`,
        BOOTSTRAP_JOURNEY_URI,
        `${BOOTSTRAP_JOURNEY_URI}/`,
    ]

    whitelistedUrls.forEach((url) => {
        it(`whitelisted urls are ignored: ${url}`, () => {
            const req = { path: url } as any
            const res = {} as Response
            const next = sinon.stub()

            middleware(req, res, next)

            assert.isTrue(next.calledOnce, `next should be called for whitelisted url: ${url}`)
            verify(sessionService.getDissolutionCompanyNumber(anything())).never()
        })
    })

    const nonWhitelistedUrls = [
        VIEW_COMPANY_INFORMATION_URI,
        SELECT_DIRECTOR_URI,
        SELECT_SIGNATORIES_URI,
        DEFINE_SIGNATORY_INFO_URI,
        CHECK_YOUR_ANSWERS_URI,
        `${CHECK_YOUR_ANSWERS_URI}/subpath`,
        `${ROOT_URI}/not-whitelisted`,
        `${ROOT_URI}/abc/view-company-information/extra`,
        "/random-path",
        `${ROOT_URI}/abc%2Fview-company-information/extra`,
        `${BOOTSTRAP_JOURNEY_URI}/subpath?companyNumber=01777777`
    ]

    nonWhitelistedUrls.forEach((path) => {
        it(`none whitelisted urls are processed: ${path}`, () => {
            const req = { path: path } as any
            const res = {} as Response
            const next = sinon.stub()

            when(sessionService.getDissolutionCompanyNumber(req)).thenReturn(undefined)

            middleware(req, res, next)

            verify(sessionService.getDissolutionCompanyNumber(req)).once()
            assert.isTrue(next.calledOnce, `next should be called for non-whitelisted url: ${path}`)
            const err = next.args[0][0]
            assert.instanceOf(err, Error)
            assert.equal(err.message, "No Company Number in session")
        })
    })

    it("when no companyNumber is present the next called WITH error", () => {
        const req = { path: "/some-path" } as any
        const res = {} as Response
        const next = sinon.stub()

        when(sessionService.getDissolutionCompanyNumber(req)).thenReturn(undefined)

        middleware(req, res, next)

        const nextError = next.args[0][0]
        assert.isTrue(next.calledOnce)
        assert.equal(nextError.message, "No Company Number in session")
    })

    it("when authenticated user is authorized for company number then next called WITHOUT error", () => {
        const signInInfo: ISignInInfo = {
            company_number: "12345678"
        }
        const req = { path: "/some-path" } as any
        const res = {} as Response
        const next = sinon.stub()

        when(sessionService.getDissolutionCompanyNumber(req)).thenReturn("12345678")
        when(sessionService.getSignInInfo(req)).thenReturn(signInInfo)

        when(companyAuthService.isAuthorisedForCompany(anything(), anything())).thenReturn(true)

        middleware(req, res, next)

        assert.isTrue(next.calledOnce)
        assert.isUndefined(next.args[0][0])
    })

    it("when authenticated user is NOT authorized for company number then redirect to Enter company auth code page", async () => {
        const signInInfo: ISignInInfo = {
            company_number: "XXXXXXXXXX"
        }

        const req = {} as any
        const res = {} as Response
        const redirectStub: sinon.SinonStub = sinon.stub()
        res.redirect = redirectStub
        const next = sinon.stub()

        when(sessionService.getDissolutionCompanyNumber(req)).thenReturn("12345678")
        when(sessionService.getSignInInfo(req)).thenReturn(signInInfo as any)
        when(companyAuthService.getAuthRedirectUri(anything(), anything())).thenResolve("http://account.chs-dev/oauth2/authorise?client_id=123456.gov.uk&redirect_uri=http://chs-dev/oauth2/user/callback&response_type=code&scope=https://account.companieshouse.gov.uk/user.write-full https://api.companieshouse.gov.uk/company/12345678")

        await middleware(req, res, next)

        assert.isTrue(redirectStub.calledOnce)
        const redirectUrl: string = redirectStub.args[0][0]
        assert.include(redirectUrl, "http://account.chs-dev/oauth2/authorise?client_id=123456.gov.uk&redirect_uri=http://chs-dev/oauth2/user/callback&response_type=code&scope=https://account.companieshouse.gov.uk/user.write-full https://api.companieshouse.gov.uk/company/12345678")
    })
})
