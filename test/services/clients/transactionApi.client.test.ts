import { assert } from "chai";
import { instance, mock, when } from "ts-mockito";
import { TOKEN } from "test/fixtures/session.fixtures";
import { StatusCodes } from "http-status-codes";
import APIClientFactory from "app/services/clients/apiClient.factory";
import TransactionApiClient, { TransactionApiError } from "app/services/clients/transactionApi.client";
import TransactionService from "@companieshouse/api-sdk-node/dist/services/transaction/service";
import { generateCreateTransactionDTOs, generateTransactionApiError } from "test/fixtures/transaction.fixtures";
import { Transaction } from "@companieshouse/api-sdk-node/dist/services/transaction/types";

const COMPANY_NUMBER = "12345678";
const TX_REF = "ABC123";
const TX_DESC = "Some transaction description";

describe("TransactionApiClient", () => {
    let factory: APIClientFactory;
    let transactionService: TransactionService;
    let transactionApiClient: TransactionApiClient;

    beforeEach(() => {
        factory = mock(APIClientFactory);
        transactionService = mock(TransactionService);
        transactionApiClient = new TransactionApiClient(instance(factory));
    });

    describe("postTransaction", () => {
        it("should create and return a transaction", async () => {
            const { createTransactionRequest, createTransactionResponse } = generateCreateTransactionDTOs(
                COMPANY_NUMBER,
                TX_DESC,
                TX_REF
            );

            when(factory.getTransactionService(TOKEN)).thenReturn(instance(transactionService));
            when(transactionService.postTransaction(createTransactionRequest)).thenResolve(createTransactionResponse);

            const response: Transaction = await transactionApiClient.postTransaction(TOKEN, createTransactionRequest);
            assert.equal(response, createTransactionResponse.resource);
        });

        it("Should throw an error when transaction api returns a non-201 status", async () => {
            const { createTransactionRequest } = generateCreateTransactionDTOs(COMPANY_NUMBER, TX_DESC, TX_REF);
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
            const { createTransactionRequest, createTransactionResponse } = generateCreateTransactionDTOs(
                COMPANY_NUMBER,
                TX_DESC,
                TX_REF
            );

            when(factory.getTransactionService(TOKEN)).thenReturn(instance(transactionService));
            when(transactionService.postTransaction(createTransactionRequest)).thenResolve({
                ...createTransactionResponse,
                httpStatusCode: StatusCodes.OK,
            });

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
            const { createTransactionRequest, createTransactionResponse } = generateCreateTransactionDTOs(
                COMPANY_NUMBER,
                TX_DESC,
                TX_REF
            );

            when(factory.getTransactionService(TOKEN)).thenReturn(instance(transactionService));
            when(transactionService.postTransaction(createTransactionRequest)).thenResolve({
                ...createTransactionResponse,
                resource: undefined,
            });

            try {
                await transactionApiClient.postTransaction(TOKEN, createTransactionRequest);
                assert.fail("Expected Error to be thrown");
            } catch (err: any) {
                assert.instanceOf(err, Error);
                assert.equal(err.message, "Failed to post transaction - No transaction resource returned");
            }
        });
    });

    describe("getTransaction", () => {
        const TX_ID = "123456-123456-123456";

        beforeEach(() => {
            when(factory.getTransactionService(TOKEN)).thenReturn(instance(transactionService));
        });

        it("should return the transaction when the API returns 200", async () => {
            const { createTransactionResponse } = generateCreateTransactionDTOs(COMPANY_NUMBER, TX_DESC, TX_REF);

            when(transactionService.getTransaction(TX_ID)).thenResolve({
                ...createTransactionResponse,
                httpStatusCode: StatusCodes.OK,
            });

            const response: Transaction = await transactionApiClient.getTransaction(TOKEN, TX_ID);
            assert.equal(response, createTransactionResponse.resource);
        });

        it("should throw a TransactionApiError when the response has no status code", async () => {
            when(transactionService.getTransaction(TX_ID)).thenResolve({});

            try {
                await transactionApiClient.getTransaction(TOKEN, TX_ID);
                assert.fail("Expected TransactionApiError to be thrown");
            } catch (err: any) {
                assert.instanceOf(err, TransactionApiError);
                assert.isUndefined(err.httpStatusCode);
                assert.deepEqual(err.errors, []);
                assert.equal(
                    err.message,
                    `Failed to get transaction for transaction id '${TX_ID}' - returned incorrect response`
                );
            }
        });

        it("should throw a TransactionApiError when the response is undefined", async () => {
            when(transactionService.getTransaction(TX_ID)).thenResolve(undefined as any);

            try {
                await transactionApiClient.getTransaction(TOKEN, TX_ID);
                assert.fail("Expected TransactionApiError to be thrown");
            } catch (err: any) {
                assert.instanceOf(err, TransactionApiError);
                assert.isUndefined(err.httpStatusCode);
                assert.equal(
                    err.message,
                    `Failed to get transaction for transaction id '${TX_ID}' - returned incorrect response`
                );
            }
        });

        [
            StatusCodes.BAD_REQUEST,
            StatusCodes.UNAUTHORIZED,
            StatusCodes.NOT_FOUND,
            StatusCodes.INTERNAL_SERVER_ERROR,
        ].forEach(status => {
            it(`should throw a TransactionApiError with errors when the api returns ${status}`, async () => {
                const errors = [{ error: "some error", type: "ch:service" }];
                when(transactionService.getTransaction(TX_ID)).thenResolve({ httpStatusCode: status, errors });

                try {
                    await transactionApiClient.getTransaction(TOKEN, TX_ID);
                    assert.fail("Expected TransactionApiError to be thrown");
                } catch (err: any) {
                    assert.instanceOf(err, TransactionApiError);
                    assert.equal(err.httpStatusCode, status);
                    assert.deepEqual(err.errors, errors);
                    assert.equal(
                        err.message,
                        `Failed to get transaction for transaction id '${TX_ID}' - invalid HTTP status ${status}`
                    );
                }
            });
        });

        it("should throw a TransactionApiError with empty errors when the api returns an error without errors", async () => {
            when(transactionService.getTransaction(TX_ID)).thenResolve({ httpStatusCode: StatusCodes.NOT_FOUND });

            try {
                await transactionApiClient.getTransaction(TOKEN, TX_ID);
                assert.fail("Expected TransactionApiError to be thrown");
            } catch (err: any) {
                assert.instanceOf(err, TransactionApiError);
                assert.deepEqual(err.errors, []);
            }
        });

        it("should throw an Error when the api returns 200 with no resource", async () => {
            when(transactionService.getTransaction(TX_ID)).thenResolve({ httpStatusCode: StatusCodes.OK });

            try {
                await transactionApiClient.getTransaction(TOKEN, TX_ID);
                assert.fail("Expected Error to be thrown");
            } catch (err: any) {
                assert.instanceOf(err, Error);
                assert.notInstanceOf(err, TransactionApiError);
                assert.equal(
                    err.message,
                    `Failed to get transaction for transaction id '${TX_ID}' - No transaction resource returned`
                );
            }
        });
    });
});
