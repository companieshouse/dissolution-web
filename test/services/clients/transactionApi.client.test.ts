import { assert } from "chai";
import { anything, deepEqual, instance, mock, verify, when } from "ts-mockito";
import { TOKEN } from "test/fixtures/session.fixtures";
import { StatusCodes } from "http-status-codes";
import APIClientFactory from "app/services/clients/apiClient.factory";
import TransactionApiClient, { TransactionApiError } from "app/services/clients/transactionApi.client";
import TransactionService from "@companieshouse/api-sdk-node/dist/services/transaction/service";
import { generateCreateTransactionDTOs, generateTransactionApiError } from "test/fixtures/transaction.fixtures";
import { Transaction } from "@companieshouse/api-sdk-node/dist/services/transaction/types";
import { DESCRIPTION, REFERENCE } from "app/constants/app.const";

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

        describe("getTransaction", () => {
            it("should return the transaction", async () => {
                const transaction = { id: "tx-123", status: "closed" } as Transaction;

                when(factory.getTransactionService(TOKEN)).thenReturn(instance(transactionService));
                when(transactionService.getTransaction("tx-123")).thenResolve({
                    httpStatusCode: StatusCodes.OK,
                    resource: transaction,
                });

                const result = await transactionApiClient.getTransaction(TOKEN, "tx-123");

                assert.equal(result, transaction);
            });

            it("should throw a TransactionApiError when the api returns a non-200 status", async () => {
                when(factory.getTransactionService(TOKEN)).thenReturn(instance(transactionService));
                when(transactionService.getTransaction("tx-123")).thenResolve(
                    generateTransactionApiError(StatusCodes.NOT_FOUND)
                );

                try {
                    await transactionApiClient.getTransaction(TOKEN, "tx-123");
                    assert.fail("Expected TransactionApiError to be thrown");
                } catch (err: any) {
                    assert.instanceOf(err, TransactionApiError);
                    assert.equal(err.httpStatusCode, StatusCodes.NOT_FOUND);
                    assert.equal(
                        err.message,
                        `Failed to get transaction - invalid HTTP status ${StatusCodes.NOT_FOUND}`
                    );
                }
            });

            it("should throw an error when no resource is returned", async () => {
                when(factory.getTransactionService(TOKEN)).thenReturn(instance(transactionService));
                when(transactionService.getTransaction("tx-123")).thenResolve({ httpStatusCode: StatusCodes.OK });

                try {
                    await transactionApiClient.getTransaction(TOKEN, "tx-123");
                    assert.fail("Expected an error to be thrown");
                } catch (err: any) {
                    assert.equal(err.message, "Failed to get transaction - No transaction resource returned");
                }
            });
        });

        describe("closeTransaction", () => {
            it("should return the payment required header", async () => {
                const paymentRequired = "http://payments-api/payments";

                when(factory.getTransactionService(TOKEN)).thenReturn(instance(transactionService));
                when(transactionService.putTransaction(anything(), "tx-123")).thenResolve({
                    httpStatusCode: StatusCodes.ACCEPTED,
                    headers: { "x-payment-required": paymentRequired },
                });

                const result = await transactionApiClient.closeTransaction(TOKEN, "tx-123");

                assert.equal(result, paymentRequired);
            });

            it("should close a transaction when API returns 202", async () => {
                const closedTransaction = {
                    id: "tx-123",
                    description: DESCRIPTION,
                    reference: REFERENCE,
                    status: "closed",
                };

                when(factory.getTransactionService(TOKEN)).thenReturn(instance(transactionService));
                when(transactionService.putTransaction(deepEqual(closedTransaction), "tx-123")).thenResolve({
                    httpStatusCode: StatusCodes.ACCEPTED,
                });

                const result = await transactionApiClient.closeTransaction(TOKEN, "tx-123");

                assert.isUndefined(result);
                verify(transactionService.putTransaction(deepEqual(closedTransaction), "tx-123")).once();
            });

            it("Should throw an error when transaction api returns a status other than 202", async () => {
                const closedTransaction = {
                    id: "tx-123",
                    description: DESCRIPTION,
                    reference: REFERENCE,
                    status: "closed",
                };

                when(factory.getTransactionService(TOKEN)).thenReturn(instance(transactionService));
                when(transactionService.putTransaction(deepEqual(closedTransaction), "tx-123")).thenResolve(
                    generateTransactionApiError(StatusCodes.BAD_REQUEST)
                );

                try {
                    await transactionApiClient.closeTransaction(TOKEN, "tx-123");
                    assert.fail("Expected TransactionApiError to be thrown");
                } catch (err) {
                    assert.instanceOf(err, TransactionApiError);
                    if (!(err instanceof TransactionApiError)) {
                        throw err;
                    }
                    assert.equal(err.httpStatusCode, StatusCodes.BAD_REQUEST);
                    assert.equal(
                        err.message,
                        `Failed to close transaction - invalid HTTP status ${StatusCodes.BAD_REQUEST}`
                    );
                }
            });
        });
    });
});
