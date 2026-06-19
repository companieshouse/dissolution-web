import { CompanyProfile } from "@companieshouse/api-sdk-node/dist/services/company-profile/types"
import Resource from "@companieshouse/api-sdk-node/dist/services/resource"
import { assert } from "chai"
import { StatusCodes } from "http-status-codes"
import {anything, instance, mock, verify, when} from "ts-mockito"
import { generateCompanyDetails, generateCompanyProfile, generateCompanyProfileResource } from "../../fixtures/companyProfile.fixtures"
import { TOKEN } from "../../fixtures/session.fixtures"

import CompanyDetailsMapper from "app/mappers/company/companyDetails.mapper"
import CompanyDetails from "app/models/companyDetails.model"
import ClosableCompanyType from "app/models/mapper/closableCompanyType.enum"
import OverseasCompanyPrefix from "app/models/mapper/overseasCompanyPrefix.enum"
import Optional from "app/models/optional"
import DirectorDetails from "app/models/view/directorDetails.model"
import CompanyProfileClient from "app/services/clients/companyProfile.client"
import CompanyOfficersService from "app/services/company-officers/companyOfficers.service"
import CompanyService from "app/services/company/company.service"

import { generateDirectorDetails } from "test/fixtures/companyOfficers.fixtures"
import TransactionService from "app/services/transaction/transaction.service"
import TransactionApiClient from "app/services/clients/transactionApi.client"
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger"
import {Transaction} from "@companieshouse/api-sdk-node/dist/services/transaction/types"
import {aTransaction} from "test/fixtures/transaction.builder"

const COMPANY_NUMBER = "12345678"
const TRANSACTION_ID = "2222"
const TX_REF = "ABC123"
const TX_DESC = "Some transaction description"

describe("TransactionService", () => {

    let service: TransactionService
    let client: TransactionApiClient
    let logger: ApplicationLogger

    const COMPANY_NUMBER = "12345678"

    beforeEach(() => {
        client = mock(TransactionApiClient)
        logger = mock(ApplicationLogger)

        service = new TransactionService(
            instance(client),
            instance(logger),
        )
    })

    describe("createTransaction", () => {
        it("should call the transaction api client and return a new transaction", async () => {
            const newTx: Transaction = aTransaction().withId(TRANSACTION_ID).withCompanyNumber(COMPANY_NUMBER).withReference(TX_REF).withDescription(TX_DESC).build()

            when(client.createTransaction(TOKEN, anything())).thenResolve(newTx)

            const result: Transaction = await service.createTransaction(TOKEN, COMPANY_NUMBER, TX_DESC, TX_REF)

            verify(client.createTransaction(TOKEN, anything())).once()

            assert.equal(result.id, TRANSACTION_ID)
            assert.equal(result.companyNumber, COMPANY_NUMBER)
            assert.equal(result.description, TX_DESC)
            assert.equal(result.reference, TX_REF)
        })

        it("should reject with an error when transaction creation failed", async () => {
            when(client.createTransaction(TOKEN, anything())).thenThrow(new Error("Some Client Error"))

            try {
                await service.createTransaction(TOKEN, COMPANY_NUMBER, TX_DESC, TX_REF)
                assert.fail()
            } catch (err: any) {
                assert.equal(err.message, "Failed to create transaction")
            }
        })
    })
})
