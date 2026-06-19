import { Transaction } from "@companieshouse/api-sdk-node/dist/services/transaction/types";
import Resource, { ApiErrorResponse } from "@companieshouse/api-sdk-node/dist/services/resource";
import { StatusCodes } from "http-status-codes";
import { aTransaction } from "test/fixtures/transaction.builder";

export function generateNewTransaction(overrides: Partial<Resource<Transaction>>): Resource<Transaction> {
    return {
        httpStatusCode: StatusCodes.CREATED,
        resource: aTransaction().build(),
        ...overrides,
    };
}

export function generateTransactionApiError(statusCode: number): ApiErrorResponse {
    return {
        httpStatusCode: statusCode,
        errors: [],
    };
}
