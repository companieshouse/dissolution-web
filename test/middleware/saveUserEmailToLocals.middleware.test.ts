import "reflect-metadata"
import { assert } from "chai"
import { Request, RequestHandler, Response } from "express"
import * as sinon from "sinon"

import SaveUserEmailToLocals from "app/middleware/saveUserEmailToLocals.middleware"
import SessionService from "app/services/session/session.service"
import { ISignInInfo } from "@companieshouse/node-session-handler/lib/session/model/SessionInterfaces"
import { generateISignInInfo } from "test/fixtures/session.fixtures"
import { generateRequest } from "test/fixtures/http.fixtures"
import { SessionKey } from "@companieshouse/node-session-handler/lib/session/keys/SessionKey"

describe("SaveUserEmailToLocals", () => {

    const EMAIL = "some@mail.com"

    let middleware: RequestHandler
    let sessionService: SessionService
    let getSessionStub: sinon.SinonStub

    beforeEach(() => {
        sessionService = new SessionService()
        getSessionStub = sinon.stub()
        middleware = SaveUserEmailToLocals(sessionService)
    })

    it("should retrieve the logged in users email from the request session", () => {
        const res = { locals: {} } as Response
        const next = sinon.stub()
        const signInInfo: ISignInInfo = generateISignInInfo()
        signInInfo.user_profile!.email = EMAIL

        const req: Request = generateRequest()
        req.session!.get = getSessionStub.withArgs(SessionKey.SignInInfo).returns(signInInfo)

        middleware(req, res, next)

        assert.isTrue(next.calledOnce)
        assert.equal(res.locals.userEmail, EMAIL)
    })

    it("should set email to undefined if there is no sign in info present in the session", () => {
        const res = { locals: {} } as Response
        const next = sinon.stub()
        const signInInfo: ISignInInfo = generateISignInInfo()
        signInInfo.user_profile!.email = EMAIL

        const req: Request = generateRequest()
        req.session!.get = getSessionStub.withArgs(SessionKey.SignInInfo).returns(undefined)

        middleware(req, res, next)

        assert.isTrue(next.calledOnce)
        assert.isUndefined(res.locals.userEmail)
    })

    it("should set email to undefined if there is no session present in the request", () => {
        const res = { locals: {} } as Response
        const next = sinon.stub()
        const signInInfo: ISignInInfo = generateISignInInfo()
        signInInfo.user_profile!.email = EMAIL

        const req: Request = generateRequest()
        req.session = undefined

        middleware(req, res, next)

        assert.isTrue(next.calledOnce)
        assert.isUndefined(res.locals.userEmail)
    })
})
