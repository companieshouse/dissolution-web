import { Transaction } from "@companieshouse/api-sdk-node/dist/services/transaction/types";
import Resource, { ApiErrorResponse } from "@companieshouse/api-sdk-node/dist/services/resource";
import { StatusCodes } from "http-status-codes";
import { aTransaction } from "test/fixtures/transaction.builder";
import { v4 as uuidv4 } from "uuid";

export function generateCreateTransactionDTOs(
    companyNumber: string,
    description: string,
    reference: string
): {
    createTransactionRequest: Transaction;
    createTransactionResponse: Resource<Transaction>;
} {
    return {
        createTransactionRequest: aTransaction()
            .withCompanyNumber(companyNumber)
            .withReference(reference)
            .withDescription(description)
            .build(),
        createTransactionResponse: {
            httpStatusCode: StatusCodes.CREATED,
            resource: aTransaction()
                .withId(uuidv4())
                .withCompanyNumber(companyNumber)
                .withReference(reference)
                .withDescription(description)
                .withStatus("open")
                .withCreatedBy(uuidv4(), "test@mail.com")
                .build(),
        },
    };
}

export function generateTransactionApiError(statusCode: number): ApiErrorResponse {
    return {
        httpStatusCode: statusCode,
        errors: [],
    };
}
