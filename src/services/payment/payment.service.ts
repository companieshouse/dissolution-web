import "reflect-metadata";

import { CreatePaymentRequest, Payment } from "@companieshouse/api-sdk-node/dist/services/payment";
import { ApiResponse } from "@companieshouse/api-sdk-node/dist/services/resource";
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger";
import { StatusCodes } from "http-status-codes";
import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";
import { DissolutionApiClient } from "../clients/dissolutionApi.client";
import PaymentApiClient from "../clients/paymentApi.client";

import PaymentMapper from "app/mappers/payment/payment.mapper";
import { TRANSACTION_PAYMENT_REFERENCE_PREFIX } from "app/constants/app.const";
import DissolutionPaymentPatchRequest from "app/models/dto/dissolutionPaymentPatchRequest";
import DissolutionSession from "app/models/session/dissolutionSession.model";
import TYPES from "app/types";

@provide(PaymentService)
export default class PaymentService {
    public constructor(
        @inject(PaymentMapper) private readonly mapper: PaymentMapper,
        @inject(TYPES.DISSOLUTIONS_API_URL) private readonly DISSOLUTIONS_API_URL: string,
        @inject(TYPES.TRANSACTIONS_API_URL) private readonly TRANSACTIONS_API_URL: string,
        @inject(PaymentApiClient) private readonly client: PaymentApiClient,
        @inject(ApplicationLogger) private readonly logger: ApplicationLogger,
        @inject(DissolutionApiClient) private readonly dissolutionClient: DissolutionApiClient
    ) {}

    public async generatePaymentURL(
        token: string,
        dissolutionSession: DissolutionSession,
        paymentStateUUID: string,
        paymentRedirectURI: string
    ): Promise<string> {
        const applicationReferenceNumber: string = dissolutionSession.applicationReferenceNumber!;

        const paymentResource: string = `${this.DISSOLUTIONS_API_URL}/dissolution-request/${applicationReferenceNumber}/payment`;

        const createPaymentRequest: CreatePaymentRequest = this.mapper.mapToCreatePaymentRequest(
            paymentRedirectURI,
            applicationReferenceNumber,
            paymentResource,
            paymentStateUUID
        );

        const response: ApiResponse<Payment> = await this.client.createPayment(token, createPaymentRequest);

        if (response.httpStatusCode !== StatusCodes.CREATED) {
            this.logger.error(JSON.stringify(response));

            return Promise.reject(new Error("Payment session failed to create"));
        }

        const dissolutionPaymentPatchRequest: DissolutionPaymentPatchRequest =
            this.mapper.mapToPaymentReferencePatchRequest(response.resource!.links.self.split("/")[1]);
        await this.dissolutionClient.patchDissolutionPaymentData(
            applicationReferenceNumber,
            dissolutionPaymentPatchRequest
        );

        return `${response.resource!.links.journey}?summary=false`;
    }

    public async generateTransactionPaymentURL(
        token: string,
        paymentSessionUrl: string,
        transactionId: string,
        paymentStateUUID: string,
        paymentRedirectURI: string
    ): Promise<string> {
        const paymentResource: string = `${this.TRANSACTIONS_API_URL}/transactions/${transactionId}/payment`;

        const createPaymentRequest: CreatePaymentRequest = this.mapper.mapToCreatePaymentRequest(
            paymentRedirectURI,
            `${TRANSACTION_PAYMENT_REFERENCE_PREFIX}_${transactionId}`,
            paymentResource,
            paymentStateUUID
        );

        const response: ApiResponse<Payment> = await this.client.createPaymentWithFullUrl(
            token,
            paymentSessionUrl,
            createPaymentRequest
        );

        if (response.httpStatusCode !== StatusCodes.CREATED) {
            const errMsg = `Failed to create transaction payment session for transaction ${transactionId}`;
            this.logger.error(`${errMsg}, received status=${response.httpStatusCode}`);
            throw new Error(errMsg);
        }

        return `${response.resource!.links.journey}?summary=false`;
    }
}
