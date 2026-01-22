import "reflect-metadata"

import { assert, expect } from "chai"
import { StatusCodes } from "http-status-codes"
import request from "supertest"
import { createApp } from "./helpers/application.factory"
import "app/controllers/stopScreenBankAccount.controller"
import { SEARCH_COMPANY_URI, STOP_SCREEN_BANK_ACCOUNT_URI } from "app/paths"
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock"

mockCsrfMiddleware.restore()

describe("StopScreenBankAccountController", () => {
    describe("GET - ensure that page loads correctly", () => {
        it("Should render the Company bank account access page", async () => {
            const app = createApp()
            const res = await request(app).get(STOP_SCREEN_BANK_ACCOUNT_URI).expect(StatusCodes.OK)
            assert.include(res.text, "Company bank account access")
        })
    })

    describe("POST - ensure form submission is handled correctly", () => {
        it("should redirect to Search Company page", async () => {
            const app = createApp()
            const res = await request(app).post(STOP_SCREEN_BANK_ACCOUNT_URI)
            expect(res.status).to.equal(StatusCodes.MOVED_TEMPORARILY)
            expect(res.header.location).to.equal(SEARCH_COMPANY_URI)
        })
    })
})
