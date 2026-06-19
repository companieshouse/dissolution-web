import "reflect-metadata";

import { ApiError } from "@companieshouse/api-sdk-node/dist/services/resource";
import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";
import APIClientFactory from "./apiClient.factory";
import { Transaction } from "@companieshouse/api-sdk-node/dist/services/transaction/types";
import { StatusCodes } from "http-status-codes";

type TransactionApiResponse<T> = {
    httpStatusCode?: number;
    resource?: T;
    errors?: ApiError[];
};

@provide(TransactionApiClient)
export default class TransactionApiClient {
    public constructor(@inject(APIClientFactory) private readonly factory: APIClientFactory) {}

    public async postTransaction(token: string, body: Transaction): Promise<Transaction> {
        const response: TransactionApiResponse<Transaction> = await this.factory
            .getTransactionService(token)
            .postTransaction(body);

        if (response.httpStatusCode !== StatusCodes.CREATED) {
            throw new TransactionApiError(
                `Failed to post transaction - invalid HTTP status ${response.httpStatusCode}`,
                response.httpStatusCode,
                response.errors
            );
        }

        if (!response.resource) {
            throw new Error("Failed to post transaction - No transaction resource returned");
        }
        return response.resource;
    }
}

export class TransactionApiError extends Error {
    public readonly httpStatusCode?: number;
    public readonly errors: ApiError[];

    constructor(msg: string, statusCode?: number, errors?: ApiError[]) {
        super(msg);
        this.httpStatusCode = statusCode;
        this.errors = errors ?? [];
    }
}
