import { assert } from "chai";
import { anything, instance, mock, verify, when } from "ts-mockito";
import { generatePaymentSummary } from "test/fixtures/payment.fixtures";
import {
    EMAIL,
    generateDissolutionConfirmation,
    generateDissolutionSession,
    TOKEN,
} from "test/fixtures/session.fixtures";

import DissolutionRequestMapper from "app/mappers/dissolution/dissolutionRequest.mapper";
import PaymentMapper from "app/mappers/payment/payment.mapper";
import { DissolutionCreateRequest } from "app/models/dto/dissolutionCreateRequest";
import DissolutionCreateResponse from "app/models/dto/dissolutionCreateResponse";
import DissolutionGetPaymentUIData from "app/models/dto/dissolutionGetPaymentUIData";
import DissolutionGetResendEmailResponse from "app/models/dto/dissolutionGetResendEmailResponse";
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse";
import DissolutionPatchRequest from "app/models/dto/dissolutionPatchRequest";
import DissolutionPaymentPatchRequest from "app/models/dto/dissolutionPaymentPatchRequest";
import PaymentSummary from "app/models/dto/paymentSummary";
import Optional from "app/models/optional";
import DissolutionConfirmation from "app/models/session/dissolutionConfirmation.model";
import DissolutionSession from "app/models/session/dissolutionSession.model";
import { DissolutionApiClient } from "app/services/clients/dissolutionApi.client";
import DissolutionService from "app/services/dissolution/dissolution.service";
import DissolutionCertificateService from "app/services/dissolution/dissolutionCertificate.service";

import {
    generateApprovalModel,
    generateDissolutionCreateDraftResponse,
    generateDissolutionCreateRequest,
    generateDissolutionCreateResponse,
    generateDissolutionGetPaymentUIData,
    generateDissolutionGetResendEmailResponse,
    generateDissolutionGetResponse,
    generateDissolutionPatchRequest,
    generateDissolutionPaymentPatchRequest,
} from "test/fixtures/dissolutionApi.fixtures";
import { aDissolutionGetResponse } from "test/fixtures/dissolutionGetResponse.builder";
import { aDissolutionGetDirector } from "test/fixtures/dissolutionGetDirector.builder";
import DissolutionCreateDraftResponse from "app/models/dto/dissolutionCreateDraftResponse";
import SessionService from "app/services/session/session.service";

describe("DissolutionService", () => {
    let dissolutionService: DissolutionService;

    let dissolutionRequestMapper: DissolutionRequestMapper;
    let client: DissolutionApiClient;
    let certificateService: DissolutionCertificateService;
    let paymentMapper: PaymentMapper;
    let sessionService: SessionService;

    let dissolutionCreateResponse: DissolutionCreateResponse;
    let dissolutionGetResponse: DissolutionGetResponse;
    let dissolutionSession: DissolutionSession;

    const REFERENCE_NUMBER = "123ABC";
    const MAPPED_BODY: DissolutionCreateRequest = generateDissolutionCreateRequest();
    const GET_RESEND_EMAIL_RESPONSE: DissolutionGetResendEmailResponse = generateDissolutionGetResendEmailResponse();

    beforeEach(() => {
        dissolutionRequestMapper = mock(DissolutionRequestMapper);
        client = mock(DissolutionApiClient);
        certificateService = mock(DissolutionCertificateService);
        paymentMapper = mock(PaymentMapper);
        sessionService = mock(SessionService);

        dissolutionCreateResponse = generateDissolutionCreateResponse();
        dissolutionGetResponse = generateDissolutionGetResponse();
        dissolutionSession = generateDissolutionSession();

        dissolutionService = new DissolutionService(
            instance(dissolutionRequestMapper),
            instance(client),
            instance(certificateService),
            instance(paymentMapper),
            instance(sessionService)
        );
    });

    describe("createDissolution", () => {
        it("should call dissolution api client and return reference number", async () => {
            when(dissolutionRequestMapper.mapToDissolutionRequest(dissolutionSession)).thenReturn(MAPPED_BODY);

            when(client.createDissolution(TOKEN, dissolutionSession.companyNumber!, MAPPED_BODY)).thenResolve(
                dissolutionCreateResponse
            );

            const res: Optional<string> = await dissolutionService.createDissolution(TOKEN, dissolutionSession);

            verify(client.createDissolution(TOKEN, dissolutionSession.companyNumber!, MAPPED_BODY)).once();

            assert.equal(res, REFERENCE_NUMBER);
        });
    });

    describe("sendEmailNotification", () => {
        it("should call dissolution api client and return a boolean", async () => {
            when(client.sendEmailNotification(anything(), anything())).thenResolve(GET_RESEND_EMAIL_RESPONSE);

            const res: boolean = await dissolutionService.sendEmailNotification("companyNo", EMAIL);

            verify(client.sendEmailNotification("companyNo", EMAIL)).once();

            assert.isTrue(res);
        });
    });

    describe("getDissolution", () => {
        it("should call dissolution api client and return dissolution info if dissolution is present", async () => {
            when(client.getDissolution(TOKEN, dissolutionSession.companyNumber!)).thenResolve(dissolutionGetResponse);

            const res: Optional<DissolutionGetResponse> = await dissolutionService.getDissolution(
                TOKEN,
                dissolutionSession
            );

            verify(client.getDissolution(TOKEN, dissolutionSession.companyNumber!)).once();

            assert.equal(res, dissolutionGetResponse);
        });

        it("should call dissolution api client and return null if dissolution is not present", async () => {
            when(client.getDissolution(TOKEN, dissolutionSession.companyNumber!)).thenResolve(null);

            const res: Optional<DissolutionGetResponse> = await dissolutionService.getDissolution(
                TOKEN,
                dissolutionSession
            );

            verify(client.getDissolution(TOKEN, dissolutionSession.companyNumber!)).once();

            assert.equal(res, null);
        });
    });

    describe("getDissolutionPaymentSummary", () => {
        let dissolutionGetPaymentUIData: DissolutionGetPaymentUIData;
        let paymentSummary: PaymentSummary;

        before(() => {
            dissolutionGetPaymentUIData = generateDissolutionGetPaymentUIData();
            paymentSummary = generatePaymentSummary();
        });

        it("should call dissolution api client and return the dissolution payment summary", async () => {
            when(client.getDissolutionPaymentUIData(dissolutionSession.applicationReferenceNumber!)).thenResolve(
                dissolutionGetPaymentUIData
            );
            when(paymentMapper.mapToPaymentSummary(dissolutionGetPaymentUIData)).thenReturn(paymentSummary);

            const response: PaymentSummary = await dissolutionService.getDissolutionPaymentSummary(dissolutionSession);

            verify(client.getDissolutionPaymentUIData(dissolutionSession.applicationReferenceNumber!)).once();

            assert.equal(response, paymentSummary);
        });
    });

    describe("addPayByAccountPaymentData", () => {
        const accountNumber: string = "222222";
        const dissolutionPaymentPatchRequest: DissolutionPaymentPatchRequest = generateDissolutionPaymentPatchRequest();

        it("should call dissolution api client to update the payment data of a dissolution", async () => {
            when(paymentMapper.mapToPayByAccountPaymentPatchRequest(dissolutionSession, accountNumber)).thenReturn(
                dissolutionPaymentPatchRequest
            );

            await dissolutionService.addPayByAccountPaymentData(dissolutionSession, accountNumber);

            verify(
                client.patchDissolutionPaymentData(
                    dissolutionSession.applicationReferenceNumber!,
                    dissolutionPaymentPatchRequest
                )
            ).once();
        });
    });

    describe("approveDissolution", () => {
        it("should call dissolution api client to approve the dissolution for the provided email", async () => {
            const officerId: string = "abc123";
            const ipAddress: string = "127.0.0.1";
            dissolutionSession.approval = { ...generateApprovalModel(), officerId };

            const body: DissolutionPatchRequest = generateDissolutionPatchRequest();

            when(dissolutionRequestMapper.mapToDissolutionPatchRequest(officerId, ipAddress)).thenReturn(body);

            await dissolutionService.approveDissolution(TOKEN, dissolutionSession, ipAddress);

            verify(client.patchDissolution(TOKEN, dissolutionSession.companyNumber!, body)).once();
        });
    });

    describe("generateDissolutionCertificateUrl", () => {
        it("should generate a URL to download the certificate and return it", async () => {
            const certificateUrl: string = "http://some-certificate-url";
            const confirmation: DissolutionConfirmation = generateDissolutionConfirmation();

            when(certificateService.generateDissolutionCertificateUrl(confirmation)).thenResolve(certificateUrl);

            const result: string = await dissolutionService.generateDissolutionCertificateUrl(confirmation);

            assert.equal(result, certificateUrl);

            verify(certificateService.generateDissolutionCertificateUrl(confirmation)).once();
        });
    });

    describe("getSignatoryEmail", () => {
        it("should return the signatory email when present in the dissolution resource", async () => {
            const signatoryId = "sign-1";
            const companyNumber = "COMP-1";
            const directorEmail = "sign1@example.com";

            const dissolutionGetResponse = aDissolutionGetResponse()
                .withCompanyNumber(companyNumber)
                .withDirectors([aDissolutionGetDirector().withOfficerId(signatoryId).withEmail(directorEmail).build()])
                .build();

            when(client.getDissolution(TOKEN, companyNumber)).thenResolve(dissolutionGetResponse);

            const res: string | undefined = await dissolutionService.getDissolutionSignatoryEmail(
                TOKEN,
                companyNumber,
                signatoryId
            );

            verify(client.getDissolution(TOKEN, companyNumber)).once();
            assert.equal(res, directorEmail);
        });

        it("should return undefined when the signatory is not present", async () => {
            const companyNumber = "COMP-2";

            const dissolutionGetResponse = aDissolutionGetResponse()
                .withCompanyNumber(companyNumber)
                .withDirectors([
                    aDissolutionGetDirector().withOfficerId("other-1").withEmail("other1@example.com").build(),
                ])
                .build();

            when(client.getDissolution(TOKEN, companyNumber)).thenResolve(dissolutionGetResponse);

            const res: string | undefined = await dissolutionService.getDissolutionSignatoryEmail(
                TOKEN,
                companyNumber,
                "no-such-id"
            );

            verify(client.getDissolution(TOKEN, companyNumber)).once();
            assert.isUndefined(res);
        });

        it("should return undefined when the dissolution resource is not present", async () => {
            const companyNumber = "COMP-3";

            when(client.getDissolution(TOKEN, companyNumber)).thenResolve(null);

            const res: string | undefined = await dissolutionService.getDissolutionSignatoryEmail(
                TOKEN,
                companyNumber,
                "abc123"
            );

            verify(client.getDissolution(TOKEN, companyNumber)).once();
            assert.isUndefined(res);
        });
    });

    describe("transaction dissolution API", () => {
        const COMPANY_NUMBER = "12345678";
        const TRANSACTION_ID = "111111-222222-333333";
        const DISSOLUTION_ID = "123ABC";
        let dissolutionCreateDraftResponse: DissolutionCreateDraftResponse;

        beforeEach(() => {
            when(sessionService.getAccessToken(anything())).thenReturn(TOKEN);
        });

        describe("createDraftDissolution", () => {
            beforeEach(() => {
                dissolutionCreateDraftResponse = generateDissolutionCreateDraftResponse();
            });

            it("should call dissolution api client and return dissolution id", async () => {
                when(client.createDraftDissolution(TOKEN, COMPANY_NUMBER, TRANSACTION_ID)).thenResolve(
                    dissolutionCreateDraftResponse
                );
                const res = await dissolutionService.createDraftDissolution(TOKEN, COMPANY_NUMBER, TRANSACTION_ID);

                assert.equal(res, DISSOLUTION_ID);
            });

            it("should propagate errors from the api client", async () => {
                when(client.createDraftDissolution(TOKEN, COMPANY_NUMBER, TRANSACTION_ID)).thenReject(
                    new Error("api failure")
                );

                try {
                    await dissolutionService.createDraftDissolution(TOKEN, COMPANY_NUMBER, TRANSACTION_ID);
                    assert.fail();
                } catch (e: any) {
                    assert.equal(e.message, "api failure");
                }
            });
        });

        describe("initiateDissolution", () => {
            const req = { params: { companyNumber: COMPANY_NUMBER, transactionId: TRANSACTION_ID } } as any;

            it("should call dissolution api client and initiate dissolution", async () => {
                when(dissolutionRequestMapper.mapToDissolutionRequest(dissolutionSession)).thenReturn(MAPPED_BODY);
                when(client.initiateDissolution(TOKEN, COMPANY_NUMBER, TRANSACTION_ID, MAPPED_BODY)).thenResolve();

                await dissolutionService.initiateDissolution(req, dissolutionSession);

                verify(client.initiateDissolution(TOKEN, COMPANY_NUMBER, TRANSACTION_ID, MAPPED_BODY)).once();
            });

            it("should propagate errors from the api client", async () => {
                when(dissolutionRequestMapper.mapToDissolutionRequest(dissolutionSession)).thenReturn(MAPPED_BODY);
                when(client.initiateDissolution(TOKEN, COMPANY_NUMBER, TRANSACTION_ID, MAPPED_BODY)).thenReject(
                    new Error("api failure")
                );

                try {
                    await dissolutionService.initiateDissolution(req, dissolutionSession);
                    assert.fail();
                } catch (e: any) {
                    assert.equal(e.message, "api failure");
                }
            });
        });

        describe("approveDissolutionForTransaction", () => {
            const req = { params: { companyNumber: COMPANY_NUMBER, transactionId: TRANSACTION_ID } } as any;
            const OFFICER_ID = "abc123";
            const IP_ADDRESS = "127.0.0.1";

            it("should map the approval and call the api client to patch the dissolution approval", async () => {
                dissolutionSession.approval = { ...generateApprovalModel(), officerId: OFFICER_ID };

                const body: DissolutionPatchRequest = generateDissolutionPatchRequest();

                when(dissolutionRequestMapper.mapToDissolutionPatchRequest(OFFICER_ID, IP_ADDRESS)).thenReturn(body);
                when(client.patchDissolutionApproval(TOKEN, COMPANY_NUMBER, TRANSACTION_ID, body)).thenResolve();

                await dissolutionService.approveDissolutionForTransaction(req, OFFICER_ID, IP_ADDRESS);

                verify(client.patchDissolutionApproval(TOKEN, COMPANY_NUMBER, TRANSACTION_ID, body)).once();
            });

            it("should propagate errors from the api client", async () => {
                dissolutionSession.approval = { ...generateApprovalModel(), officerId: OFFICER_ID };
                const body: DissolutionPatchRequest = generateDissolutionPatchRequest();

                when(dissolutionRequestMapper.mapToDissolutionPatchRequest(anything(), anything())).thenReturn(body);
                when(client.patchDissolutionApproval(TOKEN, COMPANY_NUMBER, TRANSACTION_ID, body)).thenReject(
                    new Error("api failure")
                );

                try {
                    await dissolutionService.approveDissolutionForTransaction(req, OFFICER_ID, IP_ADDRESS);
                    assert.fail();
                } catch (e: any) {
                    assert.equal(e.message, "api failure");
                }
            });
        });

        describe("resendSignatoryNotification", () => {
            const OFFICER_ID = "officer-1";
            const req = { params: { companyNumber: COMPANY_NUMBER, transactionId: TRANSACTION_ID } } as any;

            it("should return true when the api client reports the reminder was sent", async () => {
                when(client.resendSignatoryNotification(TOKEN, COMPANY_NUMBER, TRANSACTION_ID, OFFICER_ID)).thenResolve(
                    GET_RESEND_EMAIL_RESPONSE
                );

                const res: boolean = await dissolutionService.resendSignatoryNotification(req, OFFICER_ID);

                verify(client.resendSignatoryNotification(TOKEN, COMPANY_NUMBER, TRANSACTION_ID, OFFICER_ID)).once();
                assert.isTrue(res);
            });

            it("should return false when the api client reports the reminder was not sent", async () => {
                when(client.resendSignatoryNotification(TOKEN, COMPANY_NUMBER, TRANSACTION_ID, OFFICER_ID)).thenResolve(
                    {
                        reminderSent: false,
                    }
                );

                const res: boolean = await dissolutionService.resendSignatoryNotification(req, OFFICER_ID);

                assert.isFalse(res);
            });
        });
    });
});
