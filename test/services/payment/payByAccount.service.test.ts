import { AxiosError } from "axios"
import { assert } from "chai"
import { StatusCodes } from "http-status-codes"
import { instance, mock, verify, when } from "ts-mockito"
import { generateAxiosError } from "../../fixtures/axios.fixtures"
import { generatePayByAccountDetailsForm, generatePresenterAuthRequest, generatePresenterAuthResponse } from "../../fixtures/payment.fixtures"

import PayByAccountMapper from "app/mappers/payment/payByAccount.mapper"
import PresenterAuthRequest from "app/models/dto/presenterAuthRequest"
import PresenterAuthResponse from "app/models/dto/presenterAuthResponse"
import PayByAccountDetailsFormModel from "app/models/form/payByAccountDetails.model"
import Optional from "app/models/optional"
import PresenterApiClient from "app/services/clients/presenterApi.client"
import PayByAccountService from "app/services/payment/payByAccount.service"

describe("PayByAccountService", () => {

    let service: PayByAccountService

    let mapper: PayByAccountMapper
    let client: PresenterApiClient

    beforeEach(() => {
        mapper = mock(PayByAccountMapper)
        client = mock(PresenterApiClient)

        service = new PayByAccountService(
            instance(mapper),
            instance(client)
        )
    })

    describe("getAccountNumber", () => {
        const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm()
        const request: PresenterAuthRequest = generatePresenterAuthRequest()

        it("should map to a request, call the Presenter API, extract the account number and return it", async () => {
            const response: PresenterAuthResponse = generatePresenterAuthResponse()
            response.presenterAccountNumber = "1234567890"

            when(mapper.mapToPresenterAuthRequest(form)).thenReturn(request)
            when(client.getAccountNumber(request)).thenResolve(response)

            const result: Optional<string> = await service.getAccountNumber(form)

            assert.isDefined(result)
            assert.equal(result, "1234567890")

            verify(mapper.mapToPresenterAuthRequest(form)).once()
            verify(client.getAccountNumber(request)).once()
        })

        it("should return null if the Presenter API returns an unauthorized status", async () => {
            const error: AxiosError = generateAxiosError({})
      error.response!.status = StatusCodes.UNAUTHORIZED

      when(mapper.mapToPresenterAuthRequest(form)).thenReturn(request)
      when(client.getAccountNumber(request)).thenReject(error)

      const result: Optional<string> = await service.getAccountNumber(form)

      assert.isNull(result)

      verify(client.getAccountNumber(request)).once()
        })

        it("should reject with an error null if the Presenter API returns an unexpected error", async () => {
            const error: Error = new Error()

            when(mapper.mapToPresenterAuthRequest(form)).thenReturn(request)
            when(client.getAccountNumber(request)).thenReject(error)

            try {
                await service.getAccountNumber(form)
                assert.fail()
            } catch (err) {
                assert.equal(err, error)
            }

            verify(client.getAccountNumber(request)).once()
        })
    })
})
