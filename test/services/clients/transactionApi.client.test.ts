import { assert } from "chai";
import { deepEqual, instance, mock, verify, when } from "ts-mockito";
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

        describe("closeTransaction", () => {
            it("should close a transaction when API returns 200", async () => {
                const { createTransactionResponse } = generateCreateTransactionDTOs(COMPANY_NUMBER, TX_DESC, TX_REF);
                const closedTransaction = {
                    ...createTransactionResponse.resource!,
                    status: "closed",
                };

                when(factory.getTransactionService(TOKEN)).thenReturn(instance(transactionService));
                when(transactionService.getTransaction("tx-123")).thenResolve({
                    ...createTransactionResponse,
                    httpStatusCode: StatusCodes.OK,
                });
                when(transactionService.putTransaction(deepEqual(closedTransaction), "tx-123")).thenResolve({
                    httpStatusCode: StatusCodes.OK,
                });

                await transactionApiClient.closeTransaction(TOKEN, "tx-123");

                verify(transactionService.putTransaction(deepEqual(closedTransaction), "tx-123")).once();
            });

            it("Should throw an error when transaction api returns a status other than 200", async () => {
                const { createTransactionResponse } = generateCreateTransactionDTOs(COMPANY_NUMBER, TX_DESC, TX_REF);
                const closedTransaction = {
                    ...createTransactionResponse.resource!,
                    status: "closed",
                };

                when(factory.getTransactionService(TOKEN)).thenReturn(instance(transactionService));
                when(transactionService.getTransaction("tx-123")).thenResolve({
                    ...createTransactionResponse,
                    httpStatusCode: StatusCodes.OK,
                });
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
