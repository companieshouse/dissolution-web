import "reflect-metadata"

import { Session } from "@companieshouse/node-session-handler"
import { ISignInInfo } from "@companieshouse/node-session-handler/lib/session/model/SessionInterfaces"
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger"
import { assert } from "chai"
import { RequestHandler, Response } from "express"
import sinon from "sinon"
import { anything, instance, mock, when, verify } from "ts-mockito"

import CompanyAuthMiddleware from "app/middleware/companyAuth.middleware"
import AuthConfig from "app/models/authConfig"
import JwtEncryptionService from "app/services/encryption/jwtEncryption.service"
import SessionService from "app/services/session/session.service"
import {
    ACCESSIBILITY_STATEMENT_URI,
    HEALTHCHECK_URI,
    ROOT_URI,
    SEARCH_COMPANY_URI,
    STOP_SCREEN_BANK_ACCOUNT_URI,
    WHO_TO_TELL_URI
} from "app/paths"

import { generateSession } from "test/fixtures/session.fixtures"
import {aDissolutionSession} from "test/fixtures/dissolutionSession.builder";


describe("AuthMiddleware", () => {

    let middleware: RequestHandler

    let encryptionService: JwtEncryptionService
    let sessionService: SessionService
    let logger: ApplicationLogger
    let authConfig: AuthConfig
    let session: Session

    beforeEach(() => {
        encryptionService = mock(JwtEncryptionService)
        sessionService = mock(SessionService)
        logger = mock(ApplicationLogger)
        session = generateSession()

        when(sessionService.getSession(anything())).thenReturn(session)

        authConfig = {
            chsUrl: "http://chs-dev",
            accountClientId: "123456.gov.uk",
            accountRequestKey: "pXf+qkU6P6SAoY2lKW0FtKMS4PylaNA3pY2sUQxNFDk=",
            accountUrl: "http://account.chs-dev"
        }

        middleware = CompanyAuthMiddleware(
            authConfig, encryptionService, instance(sessionService), logger
        )
    })

    it("requests from whitelisted URLs are ignored", () => {
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
        ]
        for (const url of whitelistedUrls) {
            const req = { url } as any
            const res = {} as Response
            const next = sinon.stub()

            middleware(req, res, next)

            assert.isTrue(next.calledOnce, `next should be called for whitelisted url: ${url}`)
            verify(sessionService.getDissolutionSession(anything())).never()
        }
    })

    it("requests from non-whitelisted URLs are NOT ignored", () => {
        const nonWhitelistedUrls = [
            `${ROOT_URI}/not-whitelisted`,
            `${ROOT_URI}/other-page`,
            `${ROOT_URI}/abc/view-company-information/extra`,
            `${ROOT_URI}/abc/view-company-informationx`,
            "/random-path"
        ]
        for (const url of nonWhitelistedUrls) {
            const req = { url } as any
            const res = {} as Response
            const next = sinon.stub()

            when(sessionService.getDissolutionSession(req)).thenReturn(undefined)

            middleware(req, res, next)

            verify(sessionService.getDissolutionSession(req)).once()
        }
    })

    it("when no companyNumber is present the next called WITH error ", () => {
        const req = { query: {} } as any
        const res = {} as Response
        const next = sinon.stub()

        when(sessionService.getDissolutionSession(req)).thenReturn(aDissolutionSession().withCompanyNumber(undefined).build())

        middleware(req, res, next)

        const nextError = next.args[0][0]
        assert.isTrue(next.calledOnce)
        assert.equal(nextError.message, "No Company Number")
    })

    const companyNumberRetrievalScenarios = [
        {
            name: "companyNumber in query string only",
            query: { companyNumber: "12345678" },
            dissolutionSession: aDissolutionSession().withCompanyNumber(undefined).build(),
        },
        {
            name: "companyNumber in session only",
            query: {},
            dissolutionSession: aDissolutionSession().withCompanyNumber("12345678").build(),
        },
        {
            name: "companyNumber in both query string and session (query string wins)",
            query: { companyNumber: "12345678" },
            dissolutionSession: aDissolutionSession().withCompanyNumber("87654321").build(),
        }
    ]

    companyNumberRetrievalScenarios.forEach(({ name, query, dissolutionSession }) => {
        it(`when authenticated user is authorized for company number then next called WITHOUT error - ${name}` , () => {
            const signInInfo: ISignInInfo = {
                company_number: "12345678"
            }
            const req = { query } as any
            const res = {} as Response
            const next = sinon.stub()

            when(sessionService.getDissolutionSession(req)).thenReturn(dissolutionSession)
            when(sessionService.getSignInInfo(req)).thenReturn(signInInfo)

            middleware(req, res, next)

            assert.isTrue(next.calledOnce)
            assert.isUndefined(next.args[0][0])
        })
    })

    companyNumberRetrievalScenarios.forEach(({ name, query, dissolutionSession }) => {
        it(`when authenticated user is NOT authorized for company number then redirect to Enter company auth code page - ${name}` , async () => {
            const signInInfo: ISignInInfo = {
                company_number: "XXXXXXXXXX"
            }

            const req = { query } as any
            const res = {} as Response
            const redirectStub: sinon.SinonStub = sinon.stub()
            res.redirect = redirectStub
            const next = sinon.stub()

            when(sessionService.getDissolutionSession(req)).thenReturn(dissolutionSession)
            when(sessionService.getSignInInfo(req)).thenReturn(signInInfo as any)

            await middleware(req, res, next)

            assert.isTrue(redirectStub.calledOnce)
            const redirectUrl: string = redirectStub.args[0][0]
            assert.include(redirectUrl, "http://account.chs-dev/oauth2/authorise?client_id=123456.gov.uk&redirect_uri=http://chs-dev/oauth2/user/callback&response_type=code&scope=https://account.companieshouse.gov.uk/user.write-full https://api.companieshouse.gov.uk/company/12345678")
        })
    })
})
