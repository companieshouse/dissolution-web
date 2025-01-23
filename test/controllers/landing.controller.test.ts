import "reflect-metadata"
import { assert } from "chai"
import { Application } from "express"
import { StatusCodes } from "http-status-codes"
import request from "supertest"
import { createApp } from "./helpers/application.factory"
import "app/controllers/landing.controller"
import { ROOT_URI, WHO_TO_TELL_URI } from "app/paths"
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock";

mockCsrfMiddleware.restore()

const app: Application = createApp()

describe("LandingController", () => {
    describe("GET request", () => {
        it("should render the landing page", async () => {
            const res = await request(app).get(ROOT_URI).expect(StatusCodes.OK)
            assert.include(res.text, "Use this service to apply to close a public limited company, a private limited company, or a limited liability partnership (LLP).")
            assert.include(res.text, WHO_TO_TELL_URI)
        })
    })
})
