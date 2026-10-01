import "reflect-metadata";

import { assert } from "chai";
import { Application, Request } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { anything, capture, instance, mock, verify, when } from "ts-mockito";
import { ArgCaptor2 } from "ts-mockito/lib/capture/ArgCaptor";
import { TOKEN } from "../fixtures/session.fixtures";
import { createApp } from "./helpers/application.factory";

import "app/controllers/redirect.controller";
import DissolutionSessionMapper from "app/mappers/session/dissolutionSession.mapper";
import ApprovalService from "app/services/approval/approval.service";
import ApplicationStatus from "app/models/dto/applicationStatus.enum";
import DissolutionGetDirector from "app/models/dto/dissolutionGetDirector";
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse";
import PaymentStatus from "app/models/dto/paymentStatus.enum";
import DissolutionApprovalModel from "app/models/form/dissolutionApproval.model";
import DissolutionConfirmation from "app/models/session/dissolutionConfirmation.model";
import DissolutionSession from "app/models/session/dissolutionSession.model";
import {
    CERTIFICATE_SIGNED_URI,
    ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI,
    NOT_SELECTED_SIGNATORY,
    PAYMENT_CALLBACK_URI,
    PAYMENT_REVIEW_URI,
    REDIRECT_GATE_URI,
    SEARCH_COMPANY_URI,
    SELECT_DIRECTOR_URI,
    VIEW_FINAL_CONFIRMATION_URI,
    WAIT_FOR_OTHERS_TO_SIGN_URI,
} from "app/paths";
import DissolutionService from "app/services/dissolution/dissolution.service";
import SessionService from "app/services/session/session.service";
import DissolutionStatus from "app/models/dto/dissolutionStatus.enum";

import {
    generateApprovalModel,
    generateDissolutionGetResponse,
    generateGetDirector,
} from "test/fixtures/dissolutionApi.fixtures";
import { generateDissolutionConfirmation, generateDissolutionSession } from "test/fixtures/session.fixtures";
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock";
import JourneyPathService, { JourneyPathOptions } from "app/services/session/journeyPath.service";
import TransactionService from "app/services/transaction/transaction.service";
import TYPES from "app/types";
import { DESCRIPTION, REFERENCE } from "app/constants/app.const";
import { Transaction } from "@companieshouse/api-sdk-node/dist/services/transaction/types";
import { aTransaction } from "test/fixtures/transaction.builder";
import { buildTestUrl } from "test/controllers/helpers/paths.helper";
import { getSavedSession } from "test/controllers/helpers/session.helper";

mockCsrfMiddleware.restore();

type AppOverrides = Partial<{ isTransactionsEnabled: boolean }>;

describe("RedirectController", () => {
    let session: SessionService;
    let service: DissolutionService;
    let mapper: DissolutionSessionMapper;
    let approvalService: ApprovalService;
    let transactionService: TransactionService;

    const USER_EMAIL = "myemail@mail.com";
    const OTHER_USER_EMAIL = "another@mail.com";

    beforeEach(() => {
        session = mock(SessionService);
        service = mock(DissolutionService);
        mapper = mock(DissolutionSessionMapper);
        approvalService = mock(ApprovalService);
        transactionService = mock(TransactionService);

        when(session.getAccessToken(anything())).thenReturn(TOKEN);
    });

    function initApp({ isTransactionsEnabled }: AppOverrides = {}): Application {
        return createApp(container => {
            container.rebind(SessionService).toConstantValue(instance(session));
            container.rebind(DissolutionService).toConstantValue(instance(service));
            container.rebind(DissolutionSessionMapper).toConstantValue(instance(mapper));
            container.rebind(ApprovalService).toConstantValue(instance(approvalService));
            container.rebind(JourneyPathService).toConstantValue({
                journeyPath: (_req: any, pathTemplate: string, options?: JourneyPathOptions) => {
                    if (!options) {
                        return pathTemplate;
                    }
                    return buildTestUrl(pathTemplate, {
                        ...options?.params,
                        ...(options?.transactionId ? { transactionId: options.transactionId } : {}),
                    });
                },
            } as any);
            container.rebind(TransactionService).toConstantValue(instance(transactionService));
            container.rebind(TYPES.FEATURE_FLAG_TRANSACTIONS_ENABLED).toConstantValue(isTransactionsEnabled ?? false);
        });
    }

    describe("redirect GET request", () => {
        let dissolutionSession: DissolutionSession;

        beforeEach(() => {
            dissolutionSession = generateDissolutionSession();

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession);
            when(session.getUserEmail(anything())).thenReturn(USER_EMAIL);
        });

        it("should update dissolution session with reference number", async () => {
            const referenceNumber = "123456";

            const dissolution: DissolutionGetResponse = generateDissolutionGetResponse();
            dissolution.application_reference = referenceNumber;

            when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);

            await request(initApp()).get(REDIRECT_GATE_URI);

            verify(session.setDissolutionSession(anything(), anything())).once();

            const updatedSession: DissolutionSession = getSavedSession(session);
            assert.equal(updatedSession.applicationReferenceNumber, referenceNumber);
        });

        it("should redirect to select director page if dissolution has not yet been created", async () => {
            when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(null);

            await request(initApp())
                .get(REDIRECT_GATE_URI)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", buildTestUrl(SELECT_DIRECTOR_URI));

            verify(transactionService.createTransaction(TOKEN, anything(), anything(), anything())).never();
            verify(session.setDissolutionSession(anything(), anything())).never();
        });

        it("should create transaction if feature toggle is enabled and dissolution has not yet been created", async () => {
            const TRANSACTION_ID = "123456-123456-123456";
            const COMPANY_NUMBER = dissolutionSession.companyNumber;
            const newTx: Transaction = aTransaction()
                .withId(TRANSACTION_ID)
                .withCompanyNumber(COMPANY_NUMBER)
                .withReference(REFERENCE)
                .withDescription(DESCRIPTION)
                .build();

            when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(null);
            when(transactionService.createTransaction(TOKEN, COMPANY_NUMBER, DESCRIPTION, REFERENCE)).thenResolve(
                newTx
            );

            await request(initApp({ isTransactionsEnabled: true }))
                .get(REDIRECT_GATE_URI)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", buildTestUrl(SELECT_DIRECTOR_URI, { transactionId: TRANSACTION_ID }));

            verify(transactionService.createTransaction(TOKEN, COMPANY_NUMBER, DESCRIPTION, REFERENCE)).once();
            verify(session.setDissolutionSession(anything(), anything())).once();

            const updatedSession: DissolutionSession = getSavedSession(session);
            assert.equal(updatedSession.transactionId, TRANSACTION_ID);
        });

        it("should throw an error if create transaction failed when feature toggle is enabled", async () => {
            const COMPANY_NUMBER = dissolutionSession.companyNumber;

            when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(null);
            when(transactionService.createTransaction(TOKEN, COMPANY_NUMBER, DESCRIPTION, REFERENCE)).thenReject(
                new Error("Failed to create transaction")
            );

            await request(initApp({ isTransactionsEnabled: true }))
                .get(REDIRECT_GATE_URI)
                .expect(StatusCodes.INTERNAL_SERVER_ERROR);

            verify(transactionService.createTransaction(TOKEN, COMPANY_NUMBER, DESCRIPTION, REFERENCE)).once();
            verify(session.setDissolutionSession(anything(), anything())).never();
        });

        describe("Pending Approval", () => {
            let dissolution: DissolutionGetResponse;

            beforeEach(() => {
                dissolution = generateDissolutionGetResponse();
                dissolution.application_status = ApplicationStatus.PENDING_APPROVAL;
            });

            it("should redirect to sign certificate page if the application if user is pending signatory", async () => {
                const approved: DissolutionGetDirector = {
                    ...generateGetDirector(),
                    email: USER_EMAIL,
                    approved_at: new Date().toISOString(),
                };
                const pending: DissolutionGetDirector = {
                    ...generateGetDirector(),
                    email: USER_EMAIL,
                    approved_at: undefined,
                };

                dissolution.directors = [approved, pending];

                const approval: DissolutionApprovalModel = generateApprovalModel();

                when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);
                when(approvalService.getApprovalModel(TOKEN, dissolution, pending, anything())).thenResolve(approval);

                await request(initApp())
                    .get(REDIRECT_GATE_URI)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI);

                verify(approvalService.getApprovalModel(TOKEN, dissolution, pending, anything())).once();
                verify(approvalService.getApprovalModel(TOKEN, dissolution, approved, anything())).never();
                verify(session.setDissolutionSession(anything(), anything())).once();

                const updatedSession: DissolutionSession = getSavedSession(session);
                assert.equal(updatedSession.approval, approval);
            });

            it("should redirect to wait for others to sign page if the user is the applicant and user is not pending signatory", async () => {
                dissolution.created_by = USER_EMAIL;
                dissolution.directors = [
                    { ...generateGetDirector(), email: USER_EMAIL, approved_at: "2020-07-02" },
                    { ...generateGetDirector(), email: USER_EMAIL, approved_at: "2020-07-01" },
                ];

                when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);

                await request(initApp())
                    .get(REDIRECT_GATE_URI)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", WAIT_FOR_OTHERS_TO_SIGN_URI);
            });

            it("should redirect to certificate signed page when the user is not the applicant but has already signed ", async () => {
                dissolution.created_by = OTHER_USER_EMAIL;
                dissolution.directors = [{ ...generateGetDirector(), email: USER_EMAIL, approved_at: "2020-07-01" }];

                when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);

                await request(initApp())
                    .get(REDIRECT_GATE_URI)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", CERTIFICATE_SIGNED_URI);
            });

            it("should redirect to not authorised page if the user is not the applicant and not signatory", async () => {
                const signatory: DissolutionGetDirector = {
                    ...generateGetDirector(),
                    email: "random email",
                    approved_at: "2020-07-01",
                };
                dissolution.directors = [signatory];
                dissolution.created_by = OTHER_USER_EMAIL;

                when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);

                await request(initApp())
                    .get(REDIRECT_GATE_URI)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", NOT_SELECTED_SIGNATORY);
            });
        });

        describe("Pending Payment", () => {
            let dissolution: DissolutionGetResponse;

            beforeEach(() => {
                dissolution = generateDissolutionGetResponse();
                dissolution.application_status = ApplicationStatus.PENDING_PAYMENT;
            });

            it("should redirect to payment when the user is the applicant", async () => {
                dissolution.created_by = USER_EMAIL;

                when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);

                await request(initApp())
                    .get(REDIRECT_GATE_URI)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", PAYMENT_REVIEW_URI);
            });

            it("should redirect to certificate signed when the user is not the applicant", async () => {
                const signatory: DissolutionGetDirector = {
                    ...generateGetDirector(),
                    email: USER_EMAIL,
                    approved_at: "2020-07-01",
                };
                dissolution.directors = [signatory];
                dissolution.created_by = OTHER_USER_EMAIL;

                when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);

                await request(initApp())
                    .get(REDIRECT_GATE_URI)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", CERTIFICATE_SIGNED_URI);
            });

            it("should redirect to not authorised page when the user is not the applicant and not signatory", async () => {
                const signatory: DissolutionGetDirector = {
                    ...generateGetDirector(),
                    email: "random email",
                    approved_at: "2020-07-01",
                };
                dissolution.directors = [signatory];
                dissolution.created_by = OTHER_USER_EMAIL;
                dissolution.application_status = ApplicationStatus.PENDING_PAYMENT;

                when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);

                await request(initApp())
                    .get(REDIRECT_GATE_URI)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", NOT_SELECTED_SIGNATORY);
            });
        });

        describe("Paid", () => {
            let dissolution: DissolutionGetResponse;

            beforeEach(() => {
                dissolution = generateDissolutionGetResponse();
                dissolution.application_status = ApplicationStatus.PAID;
            });

            it("should prepare a confirmation session and redirect to confirmation page", async () => {
                const confirmation: DissolutionConfirmation = generateDissolutionConfirmation();

                when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);
                when(mapper.mapToDissolutionConfirmation(dissolution)).thenReturn(confirmation);

                await request(initApp())
                    .get(REDIRECT_GATE_URI)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", VIEW_FINAL_CONFIRMATION_URI);

                verify(mapper.mapToDissolutionConfirmation(dissolution)).once();
                verify(session.setDissolutionSession(anything(), anything())).once();

                const updatedSession: DissolutionSession = getSavedSession(session);
                assert.equal(updatedSession.confirmation, confirmation);
            });
        });

        describe("When user has a legacy dissolution (no transaction id)", () => {
            it("should not create a transaction or add a transaction id to the path when FEATURE_FLAG_TRANSACTIONS_ENABLED is enabled", async () => {
                const dissolution: DissolutionGetResponse = {
                    ...generateDissolutionGetResponse(),
                    application_status: ApplicationStatus.PENDING_APPROVAL,
                    created_by: USER_EMAIL,
                };

                when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);

                await request(initApp({ isTransactionsEnabled: true }))
                    .get(REDIRECT_GATE_URI)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", WAIT_FOR_OTHERS_TO_SIGN_URI);

                verify(transactionService.createTransaction(anything(), anything(), anything(), anything())).never();
                assert.isUndefined(getSavedSession(session).transactionId);
            });

            it("should return an error and not save the session if the application status is unexpected", async () => {
                const dissolution: DissolutionGetResponse = {
                    ...generateDissolutionGetResponse(),
                    application_status: "unknown" as ApplicationStatus,
                };

                when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);

                await request(initApp()).get(REDIRECT_GATE_URI).expect(StatusCodes.INTERNAL_SERVER_ERROR);

                verify(session.setDissolutionSession(anything(), anything())).never();
            });
        });

        describe("Transaction model dissolution", () => {
            const TX_ID = "tx-123456-123456";
            const txUrl = (uri: string): string => buildTestUrl(uri, { transactionId: TX_ID });

            let dissolution: DissolutionGetResponse;

            beforeEach(() => {
                dissolution = {
                    ...generateDissolutionGetResponse(),
                    transaction_id: TX_ID,
                    created_by: OTHER_USER_EMAIL,
                };

                when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);
            });

            [false, true].forEach(isTransactionsEnabled => {
                describe(`with FEATURE_FLAG_TRANSACTIONS_ENABLED ${isTransactionsEnabled ? "enabled" : "disabled"}`, () => {
                    const app = (): Application => initApp({ isTransactionsEnabled });

                    describe("Draft", () => {
                        beforeEach(() => {
                            dissolution.status = DissolutionStatus.DRAFT;
                            dissolution.created_by = USER_EMAIL;
                        });

                        it("should redirect to select director page with the existing transaction id", async () => {
                            await request(app())
                                .get(REDIRECT_GATE_URI)
                                .expect(StatusCodes.MOVED_TEMPORARILY)
                                .expect("Location", txUrl(SELECT_DIRECTOR_URI));
                        });

                        it("should save the existing transaction id to the session and not create a new transaction", async () => {
                            await request(app()).get(REDIRECT_GATE_URI).expect(StatusCodes.MOVED_TEMPORARILY);

                            verify(
                                transactionService.createTransaction(anything(), anything(), anything(), anything())
                            ).never();
                            verify(session.setDissolutionSession(anything(), anything())).once();
                            assert.equal(getSavedSession(session).transactionId, TX_ID);
                        });
                    });

                    describe("Pending", () => {
                        beforeEach(() => {
                            dissolution.status = DissolutionStatus.PENDING;
                        });

                        it("should redirect to sign certificate page with transaction id if user is pending signatory", async () => {
                            const approved: DissolutionGetDirector = {
                                ...generateGetDirector(),
                                email: USER_EMAIL,
                                approved_at: new Date().toISOString(),
                            };
                            const pending: DissolutionGetDirector = {
                                ...generateGetDirector(),
                                email: USER_EMAIL,
                                approved_at: undefined,
                            };
                            dissolution.directors = [approved, pending];

                            const approval: DissolutionApprovalModel = generateApprovalModel();
                            when(approvalService.getApprovalModel(TOKEN, dissolution, pending, anything())).thenResolve(
                                approval
                            );

                            await request(app())
                                .get(REDIRECT_GATE_URI)
                                .expect(StatusCodes.MOVED_TEMPORARILY)
                                .expect("Location", txUrl(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI));

                            verify(approvalService.getApprovalModel(TOKEN, dissolution, pending, anything())).once();

                            const savedSession: DissolutionSession = getSavedSession(session);
                            assert.equal(savedSession.approval, approval);
                            assert.equal(savedSession.transactionId, TX_ID);
                        });

                        it("should redirect to wait for others to sign page with transaction id if user is the applicant", async () => {
                            dissolution.created_by = USER_EMAIL;
                            dissolution.directors = [
                                { ...generateGetDirector(), email: USER_EMAIL, approved_at: "2020-07-01" },
                            ];

                            await request(app())
                                .get(REDIRECT_GATE_URI)
                                .expect(StatusCodes.MOVED_TEMPORARILY)
                                .expect("Location", txUrl(WAIT_FOR_OTHERS_TO_SIGN_URI));
                        });

                        it("should redirect to certificate signed page with transaction id if user is not the applicant but has signed", async () => {
                            dissolution.directors = [
                                { ...generateGetDirector(), email: USER_EMAIL, approved_at: "2020-07-01" },
                            ];

                            await request(app())
                                .get(REDIRECT_GATE_URI)
                                .expect(StatusCodes.MOVED_TEMPORARILY)
                                .expect("Location", txUrl(CERTIFICATE_SIGNED_URI));
                        });

                        it("should redirect to not selected signatory page with transaction id if user is not the applicant and not a signatory", async () => {
                            dissolution.directors = [
                                { ...generateGetDirector(), email: "random email", approved_at: "2020-07-01" },
                            ];

                            await request(app())
                                .get(REDIRECT_GATE_URI)
                                .expect(StatusCodes.MOVED_TEMPORARILY)
                                .expect("Location", txUrl(NOT_SELECTED_SIGNATORY));
                        });
                    });

                    describe("Submitted", () => {
                        beforeEach(() => {
                            dissolution.status = DissolutionStatus.SUBMITTED;
                        });

                        it("should redirect to payment review if user is the applicant", async () => {
                            dissolution.created_by = USER_EMAIL;

                            // PAYMENT_REVIEW_URI has no transaction segment yet, so the transaction id is not in the path
                            await request(app())
                                .get(REDIRECT_GATE_URI)
                                .expect(StatusCodes.MOVED_TEMPORARILY)
                                .expect("Location", buildTestUrl(PAYMENT_REVIEW_URI));

                            assert.equal(getSavedSession(session).transactionId, TX_ID);
                        });

                        it("should redirect to certificate signed page with transaction id if user is not the applicant but is a signatory", async () => {
                            dissolution.directors = [
                                { ...generateGetDirector(), email: USER_EMAIL, approved_at: "2020-07-01" },
                            ];

                            await request(app())
                                .get(REDIRECT_GATE_URI)
                                .expect(StatusCodes.MOVED_TEMPORARILY)
                                .expect("Location", txUrl(CERTIFICATE_SIGNED_URI));
                        });

                        it("should redirect to not selected signatory page with transaction id if user is not the applicant and not a signatory", async () => {
                            dissolution.directors = [
                                { ...generateGetDirector(), email: "random email", approved_at: "2020-07-01" },
                            ];

                            await request(app())
                                .get(REDIRECT_GATE_URI)
                                .expect(StatusCodes.MOVED_TEMPORARILY)
                                .expect("Location", txUrl(NOT_SELECTED_SIGNATORY));
                        });
                    });
                });
            });

            it("should use the transaction id from the backend over any transaction id already in the session", async () => {
                dissolutionSession.transactionId = "stale-transaction-id";
                dissolution.status = DissolutionStatus.DRAFT;

                await request(initApp({ isTransactionsEnabled: true }))
                    .get(REDIRECT_GATE_URI)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", txUrl(SELECT_DIRECTOR_URI));

                assert.equal(getSavedSession(session).transactionId, TX_ID);
            });

            it("should route on dissolution status rather than application status", async () => {
                dissolution.status = DissolutionStatus.DRAFT;
                dissolution.application_status = ApplicationStatus.PAID;

                await request(initApp())
                    .get(REDIRECT_GATE_URI)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", txUrl(SELECT_DIRECTOR_URI));

                verify(mapper.mapToDissolutionConfirmation(anything())).never();
            });

            [undefined, "unknown" as DissolutionStatus].forEach(status => {
                it(`should return an error and not save the session if dissolution status is ${status}`, async () => {
                    dissolution.status = status;

                    await request(initApp()).get(REDIRECT_GATE_URI).expect(StatusCodes.INTERNAL_SERVER_ERROR);

                    verify(session.setDissolutionSession(anything(), anything())).never();
                });
            });
        });
    });

    describe("payment callback GET request", () => {
        const STATE: string = "ABC123";
        const REF: string = "ABC123";

        let dissolutionSession: DissolutionSession = generateDissolutionSession();

        beforeEach(() => {
            dissolutionSession = generateDissolutionSession();
            dissolutionSession.paymentStateUUID = STATE;

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession);
        });

        it("should throw an error if GovPay state is invalid", async () => {
            await request(initApp())
                .get(PAYMENT_CALLBACK_URI)
                .query({
                    state: "not-valid-state",
                    status: PaymentStatus.PAID,
                    ref: "123456",
                })
                .expect(StatusCodes.INTERNAL_SERVER_ERROR);
        });

        it("should update dissolution session with reference number", async () => {
            await request(initApp())
                .get(PAYMENT_CALLBACK_URI)
                .query({
                    state: STATE,
                    status: PaymentStatus.PAID,
                    ref: REF,
                })
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", VIEW_FINAL_CONFIRMATION_URI);

            verify(session.setDissolutionSession(anything(), anything())).once();

            const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(
                session.setDissolutionSession
            );
            const updatedSession: DissolutionSession = getSavedSession(session);

            assert.equal(updatedSession.applicationReferenceNumber, REF);
        });

        it("should prepare a confirmation session and redirect to confirmation page if status is paid", async () => {
            const dissolution: DissolutionGetResponse = generateDissolutionGetResponse();
            const confirmation: DissolutionConfirmation = generateDissolutionConfirmation();

            when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);
            when(mapper.mapToDissolutionConfirmation(dissolution)).thenReturn(confirmation);

            await request(initApp())
                .get(PAYMENT_CALLBACK_URI)
                .query({
                    state: STATE,
                    status: PaymentStatus.PAID,
                    ref: REF,
                })
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", VIEW_FINAL_CONFIRMATION_URI);

            verify(mapper.mapToDissolutionConfirmation(dissolution)).once();
            verify(session.setDissolutionSession(anything(), anything())).once();

            const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(
                session.setDissolutionSession
            );
            const updatedSession: DissolutionSession = getSavedSession(session);

            assert.equal(updatedSession.confirmation, confirmation);
        });

        it("should redirect to payment if status is failed", async () => {
            await request(initApp())
                .get(PAYMENT_CALLBACK_URI)
                .query({
                    state: STATE,
                    status: PaymentStatus.FAILED,
                    ref: REF,
                })
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", PAYMENT_REVIEW_URI);
        });

        it("should redirect to search company if status is cancelled", async () => {
            await request(initApp())
                .get(PAYMENT_CALLBACK_URI)
                .query({
                    state: STATE,
                    status: PaymentStatus.CANCELLED,
                    ref: REF,
                })
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", SEARCH_COMPANY_URI);
        });
    });
});
