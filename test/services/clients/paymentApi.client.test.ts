import { CreatePaymentRequest, Payment, PaymentService } from "@companieshouse/api-sdk-node/dist/services/payment";
import { ApiResponse, ApiResult } from "@companieshouse/api-sdk-node/dist/services/resource";
import { assert } from "chai";
import { instance, mock, when } from "ts-mockito";
import { generateCreatePaymentRequest, generatePaymentResult } from "test/fixtures/payment.fixtures";
import { TOKEN } from "test/fixtures/session.fixtures";

import APIClientFactory from "app/services/clients/apiClient.factory";
import PaymentApiClient from "app/services/clients/paymentApi.client";

describe("PaymentApiClient", () => {
    let paymentApiClient: PaymentApiClient;

    let factory: APIClientFactory;
    let paymentService: PaymentService;

    beforeEach(() => {
        factory = mock(APIClientFactory);
        paymentService = mock(PaymentService);

        paymentApiClient = new PaymentApiClient(instance(factory));
    });

    describe("createPayment", () => {
        it("should fetch and return the payment details for the provided payment request", async () => {
            const createPaymentRequest: CreatePaymentRequest = generateCreatePaymentRequest();
            const paymentResult: ApiResult<ApiResponse<Payment>> = generatePaymentResult();

            when(factory.getPaymentService(TOKEN)).thenReturn(instance(paymentService));
            when(paymentService.createPayment(createPaymentRequest)).thenResolve(paymentResult);

            const paymentResponse: ApiResponse<Payment> = await paymentApiClient.createPayment(
                TOKEN,
                createPaymentRequest
            );

            assert.equal(paymentResponse, paymentResult.value);
        });
    });

    describe("createPaymentWithFullUrl", () => {
        it("should create the payment against the supplied URL", async () => {
            const createPaymentRequest: CreatePaymentRequest = generateCreatePaymentRequest();
            const paymentResult: ApiResult<ApiResponse<Payment>> = generatePaymentResult();
            const paymentUrl = "http://payments-api/payments";

            when(factory.getPaymentService(TOKEN, paymentUrl)).thenReturn(instance(paymentService));
            when(paymentService.createPaymentWithFullUrl(createPaymentRequest)).thenResolve(paymentResult);

            const paymentResponse: ApiResponse<Payment> = await paymentApiClient.createPaymentWithFullUrl(
                TOKEN,
                paymentUrl,
                createPaymentRequest
            );

            assert.equal(paymentResponse, paymentResult.value);
        });
    });
});
