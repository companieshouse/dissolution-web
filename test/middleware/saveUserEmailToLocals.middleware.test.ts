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
import { Session } from "@companieshouse/node-session-handler"

describe("SaveUserEmailToLocals", () => {

    const EMAIL = "some@mail.com"

    let middleware: RequestHandler
    let sessionService: SessionService
    let req: Request
    let res: Response
    let next: sinon.SinonStub

    beforeEach(() => {
        sessionService = new SessionService()
        middleware = SaveUserEmailToLocals(sessionService)
        req = generateRequest()
        res = { locals: {} } as Response
        next = sinon.stub()
    })

    it("should retrieve the logged in users email from the request session", () => {
        const signInInfo: ISignInInfo = generateISignInInfo()
        signInInfo.user_profile!.email = EMAIL
        const getSessionStub = sinon.stub()
        req.session!.get = getSessionStub.withArgs(SessionKey.SignInInfo).returns(signInInfo)

        middleware(req, res, next)

        assert.isTrue(next.calledOnce, "next should be called")
        assert.equal(res.locals.userEmail, EMAIL, "No userEmail in session")
    })

    it("should set email to undefined when there is no sign in info present in the session", () => {
        const getSessionStub = sinon.stub()
        req.session!.get = getSessionStub.withArgs(SessionKey.SignInInfo).returns(undefined)

        middleware(req, res, next)

        assert.isTrue(next.calledOnce, "next should be called")
        assert.isUndefined(res.locals.userEmail)
    })

    it("should not set email when there is no session present in the request", () => {
        req.session = undefined

        middleware(req, res, next)

        assert.isTrue(next.calledOnce, "next should be called")
        assert.isUndefined(res.locals.userEmail)
    })

    it("should not call next if sessionService throws", () => {
        req.session = {} as Session

        middleware(req, res, next)

        const nextError = next.args[0][0]
        assert.isTrue(next.calledOnce)
        assert.equal(nextError.message, "Malformed session: req.session.get is not a function")
    })
})
