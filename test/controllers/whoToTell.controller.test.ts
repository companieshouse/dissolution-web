import "reflect-metadata"

import { assert } from "chai"
import { StatusCodes } from "http-status-codes"
import request from "supertest"
import { deepEqual, instance, mock, when } from "ts-mockito"
import { createApp } from "./helpers/application.factory"

import "app/controllers/whoToTell.controller"
import WhoToTellFormModel from "app/models/form/whoToTell.model"
import ValidationErrors from "app/models/view/validationErrors.model"
import { SEARCH_COMPANY_URI, WHO_TO_TELL_URI, STOP_SCREEN_BANK_ACCOUNT_URI } from "app/paths"
import formSchema from "app/schemas/whoToTell.schema"
import FormValidator from "app/utils/formValidator.util"
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock"

mockCsrfMiddleware.restore()

describe("WhoToTellController", () => {
    describe("GET - ensure that page loads correctly", () => {
        it("should render the who to tell page", async () => {
            const app = createApp()

            const res = await request(app).get(WHO_TO_TELL_URI).expect(StatusCodes.OK)

            assert.include(res.text, "Who to tell about the company closing")
        })
    })

    describe("POST - ensure form submission is handled correctly", () => {
        it("should redirect successfully if validator returns no errors", async () => {
            const testObject: WhoToTellFormModel = { confirmation: "understood" }

            const mockedFormValidator = mock(FormValidator)
            when(mockedFormValidator.validate(deepEqual(testObject), formSchema)).thenReturn(null)

            const app = createApp(container => {
                container.rebind(FormValidator).toConstantValue(instance(mockedFormValidator))
            })

            await request(app).post(WHO_TO_TELL_URI)
                .send(testObject)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", STOP_SCREEN_BANK_ACCOUNT_URI)
        })
    })

    it("should render view with errors displayed if validator returns errors", async () => {
        const testObject: WhoToTellFormModel = { confirmation: "understood" }
        const mockError: ValidationErrors = {
            confirmation: `Test confirmation error`
        }

        const mockedFormValidator = mock(FormValidator)
        when(mockedFormValidator.validate(deepEqual(testObject), formSchema)).thenReturn(mockError)
        const app = createApp(container => {
            container.rebind(FormValidator).toConstantValue(instance(mockedFormValidator))
        })

        const res = await request(app).post(WHO_TO_TELL_URI).send(testObject).expect(StatusCodes.BAD_REQUEST)
        assert.equal(res.text.match(/Test confirmation error/g)!.length, 2)
    })
})
