import "reflect-metadata"
import { assert } from "chai"
import sinon from "sinon"
import CompanyAuthService from "app/services/auth/companyAuth.service"
import JwtEncryptionService from "app/services/encryption/jwtEncryption.service"
import SessionService from "app/services/session/session.service"
import AuthConfig from "app/models/authConfig"
import { Request } from "express"

describe("CompanyAuthService", () => {
    let encryptionService: any
    let sessionService: any
    let authConfig: AuthConfig
    let service: CompanyAuthService

    beforeEach(() => {
        encryptionService = {
            generateNonce: sinon.stub().returns("nonce-123"),
            jweEncodeWithNonce: sinon.stub().resolves("encoded-state")
        }

        sessionService = {
            getSignInInfo: sinon.stub(),
            setCompanyAuthNonce: sinon.stub()
        }

        authConfig = {
            chsUrl: "http://chs-dev",
            accountClientId: "client-id",
            accountRequestKey: "key",
            accountUrl: "http://account.chs-dev"
        }

        service = new CompanyAuthService(authConfig as any, encryptionService as JwtEncryptionService, sessionService as SessionService)
    })

    describe("isAuthorisedForCompany", () => {
        it("when signInInfo company number MATCHES provided company number then TRUE returned", () => {
            const req = {} as Request
            sessionService.getSignInInfo.withArgs(req).returns({ company_number: "123" })

            const result = service.isAuthorisedForCompany(req, "123")
            assert.isTrue(result)
        })

        it("when signInInfo company number does NOT MATCH provided company number then FALSE returned", () => {
            const req = {} as Request
            sessionService.getSignInInfo.withArgs(req).returns({ company_number: "999" })

            assert.isFalse(service.isAuthorisedForCompany(req, "123"))
        })

        it("when provided company number is missing then FALSE returned", () => {
            const req = {} as Request
            sessionService.getSignInInfo.withArgs(req).returns({ company_number: "999" })

            assert.isFalse(service.isAuthorisedForCompany(req, undefined))
        })
    })

    describe("issueAuthRedirectUri", () => {
        it("composes the auth url and stores nonce in session", async () => {
            const req = {} as Request
            const companyNumber = "12345678"

            const url = await service.issueAuthRedirectUri(req, companyNumber)

            assert.include(url, "http://account.chs-dev/oauth2/authorise?")
            assert.include(url, "client_id=client-id")
            assert.include(url, "response_type=code")
            assert.include(url, encodeURIComponent(`https://api.companieshouse.gov.uk/company/${companyNumber}`))
            sinon.assert.calledOnce(sessionService.setCompanyAuthNonce)
            sinon.assert.calledWith(sessionService.setCompanyAuthNonce, req, "nonce-123")
        })
    })
})

