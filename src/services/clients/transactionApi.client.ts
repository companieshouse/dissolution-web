import "reflect-metadata";

import { ApiError } from "@companieshouse/api-sdk-node/dist/services/resource";
import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";
import APIClientFactory from "./apiClient.factory";
import { Transaction } from "@companieshouse/api-sdk-node/dist/services/transaction/types";
import { StatusCodes } from "http-status-codes";

const PAYMENT_REQUIRED_HEADER = "x-payment-required";

type TransactionApiResponse<T> = {
    httpStatusCode?: number;
    resource?: T;
    errors?: ApiError[];
    headers?: Record<string, string | string[]>;
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

    public async closeTransaction(token: string, transactionId: string): Promise<void> {
        const service = this.factory.getTransactionService(token);

        const getResponse: TransactionApiResponse<Transaction> = await service.getTransaction(transactionId);

        if (getResponse.httpStatusCode !== StatusCodes.OK) {
            throw new TransactionApiError(
                `Failed to get transaction - invalid HTTP status ${getResponse.httpStatusCode}`,
                getResponse.httpStatusCode,
                getResponse.errors
            );
        }

        if (!getResponse.resource) {
            throw new Error("Failed to get transaction - No transaction resource returned");
        }

        const response: TransactionApiResponse<Transaction> = await service.putTransaction(
            {
                ...getResponse.resource,
                status: "closed",
            },
            transactionId
        );

        if (response.httpStatusCode !== StatusCodes.OK) {
            throw new TransactionApiError(
                `Failed to close transaction - invalid HTTP status ${response.httpStatusCode}`,
                response.httpStatusCode,
                response.errors,
                response.headers?.[PAYMENT_REQUIRED_HEADER]
            );
        }
    }
}

export class TransactionApiError extends Error {
    public readonly httpStatusCode?: number;
    public readonly errors: ApiError[];
    public readonly paymentRequiredHeader?: string | string[];

    constructor(msg: string, statusCode?: number, errors?: ApiError[], paymentRequiredHeader?: string | string[]) {
        super(msg);
        this.httpStatusCode = statusCode;
        this.errors = errors ?? [];
        this.paymentRequiredHeader = paymentRequiredHeader;
    }
}
