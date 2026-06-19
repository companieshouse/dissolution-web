import "reflect-metadata"

import Resource, {
  ApiError,
  ApiErrorResponse,
} from "@companieshouse/api-sdk-node/dist/services/resource"
import { inject } from "inversify"
import { provide } from "inversify-binding-decorators"
import APIClientFactory from "./apiClient.factory"
import {Transaction} from "@companieshouse/api-sdk-node/dist/services/transaction/types";
import Optional from "app/models/optional";
import {StatusCodes} from "http-status-codes";

@provide(TransactionApiClient)
export default class TransactionApiClient {

    public constructor (@inject(APIClientFactory) private readonly factory: APIClientFactory) {}

    public async createTransaction (token: string, body: Transaction): Promise<Transaction> {
        const response: Resource<Transaction> | ApiErrorResponse = await this.factory.getTransactionService(token).postTransaction(body)

        if (this.isFailure(response)) {
            throw new TransactionApiError("Failed to post transaction", response.httpStatusCode, response.errors)
        } else if (response.httpStatusCode !== StatusCodes.CREATED) {
            throw new TransactionApiError("Failed to create transaction", response.httpStatusCode)
        }

        const tx: Optional<Transaction> = this.unwrapResponse(response)
        if (!tx) {
            throw new Error("Failed to return a transaction response")
        }
        return tx
    }

    public isFailure (obj: any): obj is ApiErrorResponse {
        return !obj.httpStatusCode || obj.httpStatusCode >= 400
    }

    public unwrapResponse<T>(response: Resource<T>): Optional<T> {
        return response.resource
    }
}

export class TransactionApiError extends Error {
    public readonly httpStatusCode?: number
    public readonly errors: ApiError[]

    constructor(msg: string, statusCode?: number, errors?: ApiError[]) {
        super(msg)
        this.httpStatusCode = statusCode
        this.errors = errors ?? []
    }
}