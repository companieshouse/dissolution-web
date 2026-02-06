import { expect } from "chai"
import request from "supertest"
import { createApp } from "./helpers/application.factory"
import "app/controllers/searchCompany.controller"
import { SEARCH_COMPANY_URI } from "app/paths"
import { StatusCodes } from "http-status-codes"

describe("SearchCompanyController", () => {

    describe("GET request", () => {
        it("should redirect to company lookup", async () => {
            const app = createApp()
            const expectedRedirect = "/company-lookup/search?forward=/close-a-company/view-company-information?companyNumber=%7BcompanyNumber%7D"

            const res = await request(app)
                .get(SEARCH_COMPANY_URI)
                .expect(StatusCodes.MOVED_TEMPORARILY)

            expect(res.headers.location).to.equal(expectedRedirect)
        })
    })

})
