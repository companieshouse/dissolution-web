import "reflect-metadata"

import { AuthOptions } from "@companieshouse/web-security-node"
import { assert } from "chai"
import { NextFunction, Request, RequestHandler, Response } from "express"
import * as sinon from "sinon"
import { instance, mock, when } from "ts-mockito"

import AuthMiddleware from "app/middleware/auth.middleware"
import { WHO_TO_TELL_URI } from "app/paths"
import UriFactory from "app/utils/uri.factory"

describe("AuthMiddleware", () => {

    let middleware: RequestHandler

    let uriFactory: UriFactory
    let commonAuthStub: sinon.SinonStub
    let authCallbackStub: sinon.SinonStub

    // const accountWebUrl = "some-account-url"
    const chsWebUrl = "some-chs-url"

    beforeEach(() => {
        uriFactory = mock(UriFactory)
        authCallbackStub = sinon.stub()
        commonAuthStub = sinon.stub().returns(authCallbackStub)

        middleware = AuthMiddleware(
            chsWebUrl,
            instance(uriFactory),
            commonAuthStub
        )
    })

    it("should invoke common auth library with correct values when handling incoming request", () => {
        const req = {} as Request
        const res = {} as Response
        const next = {} as NextFunction

        const expectedAuthOptions: AuthOptions = {
            chsWebUrl,
            returnUrl: "some-uri"
        }

        when(uriFactory.createAbsoluteUri(req, WHO_TO_TELL_URI)).thenReturn("some-uri")

        middleware(req, res, next)

        assert.isTrue(commonAuthStub.calledOnce)

        const actualAuthOptions: AuthOptions = commonAuthStub.args[0][0]
        assert.deepEqual(actualAuthOptions, expectedAuthOptions)

        assert.isTrue(authCallbackStub.calledOnceWith(req, res, next))
    })
})
