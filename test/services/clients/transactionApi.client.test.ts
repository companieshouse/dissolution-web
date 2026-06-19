import { assert } from "chai";
import { instance, mock, when } from "ts-mockito";
import { TOKEN } from "test/fixtures/session.fixtures";
import { StatusCodes } from "http-status-codes";
import APIClientFactory from "app/services/clients/apiClient.factory";
import TransactionApiClient, { TransactionApiError } from "app/services/clients/transactionApi.client";
import TransactionService from "@companieshouse/api-sdk-node/dist/services/transaction/service";
import { generateNewTransaction, generateTransactionApiError } from "test/fixtures/transaction.fixtures";
import { Transaction } from "@companieshouse/api-sdk-node/dist/services/transaction/types";
import { aTransaction } from "test/fixtures/transaction.builder";

const COMPANY_NUMBER = "12345678";
const TRANSACTION_ID = "2222";
const TX_REF = "ABC123";
const TX_DESC = "Some transaction description";

describe("TransactionApiClient", () => {
    let factory: APIClientFactory;
    let transactionService: TransactionService;
    let transactionApiClient: TransactionApiClient;
    let createTransactionRequest: Transaction;

    beforeEach(() => {
        factory = mock(APIClientFactory);
        transactionService = mock(TransactionService);
        transactionApiClient = new TransactionApiClient(instance(factory));
        createTransactionRequest = aTransaction()
            .withCompanyNumber(COMPANY_NUMBER)
            .withReference(TX_REF)
            .withDescription(TX_DESC)
            .build();
    });

    describe("createTransaction", () => {
        it("should create and return a transaction", async () => {
            const newTx: Transaction = aTransaction()
                .withId(TRANSACTION_ID)
                .withCompanyNumber(COMPANY_NUMBER)
                .withReference(TX_REF)
                .withDescription(TX_DESC)
                .build();
            const result = generateNewTransaction({ resource: newTx });

            when(factory.getTransactionService(TOKEN)).thenReturn(instance(transactionService));
            when(transactionService.postTransaction(createTransactionRequest)).thenResolve(result);

            const response: Transaction = await transactionApiClient.postTransaction(TOKEN, createTransactionRequest);
            assert.equal(response, result.resource);
        });

        it("Should throw an error when transaction api returns a status greater than 400", async () => {
            const result = generateTransactionApiError(StatusCodes.BAD_REQUEST);

            when(factory.getTransactionService(TOKEN)).thenReturn(instance(transactionService));
            when(transactionService.postTransaction(createTransactionRequest)).thenResolve(result);

            try {
                await transactionApiClient.postTransaction(TOKEN, createTransactionRequest);
                assert.fail("Expected TransactionApiError to be thrown");
            } catch (err: any) {
                assert.instanceOf(err, TransactionApiError);
                assert.equal(err.httpStatusCode, StatusCodes.BAD_REQUEST);
                assert.equal(
                    err.message,
                    `Failed to post transaction - invalid HTTP status ${StatusCodes.BAD_REQUEST}`
                );
            }
        });

        it("Should throw an error when transaction api returns a status other than 201", async () => {
            const newTx: Transaction = aTransaction()
                .withId(TRANSACTION_ID)
                .withCompanyNumber(COMPANY_NUMBER)
                .withReference(TX_REF)
                .withDescription(TX_DESC)
                .build();
            const result = generateNewTransaction({ httpStatusCode: StatusCodes.OK, resource: newTx });

            when(factory.getTransactionService(TOKEN)).thenReturn(instance(transactionService));
            when(transactionService.postTransaction(createTransactionRequest)).thenResolve(result);

            try {
                await transactionApiClient.postTransaction(TOKEN, createTransactionRequest);
                assert.fail("Expected TransactionApiError to be thrown");
            } catch (err: any) {
                assert.instanceOf(err, TransactionApiError);
                assert.equal(err.httpStatusCode, StatusCodes.OK);
                assert.equal(err.message, `Failed to post transaction - invalid HTTP status ${StatusCodes.OK}`);
            }
        });

        it("Should throw an error when transaction api returns no resource", async () => {
            const result = generateNewTransaction({ httpStatusCode: StatusCodes.CREATED, resource: undefined });

            when(factory.getTransactionService(TOKEN)).thenReturn(instance(transactionService));
            when(transactionService.postTransaction(createTransactionRequest)).thenResolve(result);

            try {
                await transactionApiClient.postTransaction(TOKEN, createTransactionRequest);
                assert.fail("Expected Error to be thrown");
            } catch (err: any) {
                assert.instanceOf(err, Error);
                assert.equal(err.message, "Failed to post transaction - No transaction resource returned");
            }
        });
    });
});
