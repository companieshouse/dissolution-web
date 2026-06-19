import { assert } from "chai";
import { StatusCodes } from "http-status-codes";
import { anything, instance, mock, verify, when } from "ts-mockito";
import { TOKEN } from "../../fixtures/session.fixtures";
import TransactionService from "app/services/transaction/transaction.service";
import TransactionApiClient, { TransactionApiError } from "app/services/clients/transactionApi.client";
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger";
import { Transaction } from "@companieshouse/api-sdk-node/dist/services/transaction/types";
import { aTransaction } from "test/fixtures/transaction.builder";

const COMPANY_NUMBER = "12345678";
const TRANSACTION_ID = "2222";
const TX_REF = "ABC123";
const TX_DESC = "Some transaction description";

describe("TransactionService", () => {
    let service: TransactionService;
    let client: TransactionApiClient;
    let logger: ApplicationLogger;

    beforeEach(() => {
        client = mock(TransactionApiClient);
        logger = mock(ApplicationLogger);

        service = new TransactionService(instance(client), instance(logger));
    });

    describe("createTransaction", () => {
        it("should call the transaction api client and return a new transaction", async () => {
            const newTx: Transaction = aTransaction()
                .withId(TRANSACTION_ID)
                .withCompanyNumber(COMPANY_NUMBER)
                .withReference(TX_REF)
                .withDescription(TX_DESC)
                .build();

            when(client.postTransaction(TOKEN, anything())).thenResolve(newTx);

            const result: Transaction = await service.createTransaction(TOKEN, COMPANY_NUMBER, TX_DESC, TX_REF);

            verify(client.postTransaction(TOKEN, anything())).once();

            assert.equal(result.id, TRANSACTION_ID);
            assert.equal(result.companyNumber, COMPANY_NUMBER);
            assert.equal(result.description, TX_DESC);
            assert.equal(result.reference, TX_REF);
        });

        it("should reject with an error when transaction creation failed", async () => {
            when(client.postTransaction(TOKEN, anything())).thenThrow(new Error("Some Client Error"));

            try {
                await service.createTransaction(TOKEN, COMPANY_NUMBER, TX_DESC, TX_REF);
                assert.fail();
            } catch (err: any) {
                assert.equal(err.message, `Failed to create transaction for company number ${COMPANY_NUMBER}`);
            }
        });

        it("should reject with an error when TransactionAPIError is caught", async () => {
            when(client.postTransaction(TOKEN, anything())).thenThrow(
                new TransactionApiError("some api error", StatusCodes.INTERNAL_SERVER_ERROR, [])
            );

            try {
                await service.createTransaction(TOKEN, COMPANY_NUMBER, TX_DESC, TX_REF);
                assert.fail();
            } catch (err: any) {
                assert.equal(err.message, `Failed to create transaction for company number ${COMPANY_NUMBER}`);
            }
        });
    });
});
