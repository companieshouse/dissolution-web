import "reflect-metadata"

import { assert } from "chai"
import { Application, RequestHandler } from "express"
import * as sinon from "sinon"

import CustomServerMiddlewareLoader from "app/middleware/customServerMiddlewareLoader.middleware"

describe("CustomServerMiddlewareLoader", () => {

    let loader: CustomServerMiddlewareLoader

    let app: Application
    let appUseSpy: sinon.SinonSpy

    let sessionMiddleware: RequestHandler
    let saveUserEmailToLocals: RequestHandler
    let authMiddleware: RequestHandler
    let companyAuthMiddleware: RequestHandler

    beforeEach(() => {
        sessionMiddleware = sinon.stub()
        saveUserEmailToLocals = sinon.stub()
        authMiddleware = sinon.stub()
        companyAuthMiddleware = sinon.stub()

        appUseSpy = sinon.spy()
        app = { use: appUseSpy } as unknown as Application

        loader = new CustomServerMiddlewareLoader(
            sessionMiddleware,
            saveUserEmailToLocals,
            authMiddleware,
            companyAuthMiddleware
        )
    })

    describe("loadCustomServerMiddleware", () => {
        it("should register all middlewares in the correct order", () => {
            loader.loadCustomServerMiddleware(app)

            const registeredMiddlewares = appUseSpy.args.map((call: any[]) => call[0])

            assert.equal(appUseSpy.callCount, 4)
            assert.deepEqual(registeredMiddlewares, [
                sessionMiddleware,
                authMiddleware,
                saveUserEmailToLocals,
                companyAuthMiddleware
            ])
        })
    })
})