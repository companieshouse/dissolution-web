import "reflect-metadata";

import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";
import DissolutionCertificateService from "./dissolutionCertificate.service";

import DissolutionRequestMapper from "app/mappers/dissolution/dissolutionRequest.mapper";
import PaymentMapper from "app/mappers/payment/payment.mapper";
import { DissolutionCreateRequest, DissolutionInitiationRequest } from "app/models/dto/dissolutionCreateRequest";
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
import DissolutionCreateDraftResponse from "app/models/dto/dissolutionCreateDraftResponse";
import { Request } from "express";
import SessionService from "app/services/session/session.service";
import {
    getCompanyNumberAndTransactionIdFromRequest,
    hasCompanyNumberAndTransactionIdInRequest,
} from "app/utils/transaction.util";
import TYPES from "app/types";
import convertToCurrency from "app/utils/currencyConverter.util";

@provide(DissolutionService)
export default class DissolutionService {
    public constructor(
        @inject(DissolutionRequestMapper) private readonly dissolutionRequestMapper: DissolutionRequestMapper,
        @inject(DissolutionApiClient) private readonly client: DissolutionApiClient,
        @inject(DissolutionCertificateService) private readonly certificateService: DissolutionCertificateService,
        @inject(TYPES.LLDS01_AND_DS01_FEE) private readonly fee: string,
        @inject(TYPES.LLDS01_AND_DS01_PAYMENT_DESCRIPTION) private readonly paymentDescription: string,
        @inject(PaymentMapper) private readonly paymentMapper: PaymentMapper,
        @inject(SessionService) private readonly session: SessionService
    ) {}

    public async createDissolution(token: string, dissolutionSession: DissolutionSession): Promise<string> {
        const body: DissolutionCreateRequest =
            this.dissolutionRequestMapper.mapToDissolutionRequest(dissolutionSession);
        const companyNumber: string = dissolutionSession.companyNumber!;

        const response: DissolutionCreateResponse = await this.client.createDissolution(token, companyNumber, body);

        return response.application_reference_number;
    }

    public async getDissolution(
        token: string,
        dissolutionSession: DissolutionSession
    ): Promise<Optional<DissolutionGetResponse>> {
        const companyNumber: string = dissolutionSession.companyNumber!;

        return await this.client.getDissolution(token, companyNumber);
    }

    public async sendEmailNotification(companyNumber: string, directorEmail: string): Promise<boolean> {
        const response: DissolutionGetResendEmailResponse = await this.client.sendEmailNotification(
            companyNumber,
            directorEmail
        );

        return response.reminderSent;
    }

    public async getDissolutionSignatoryEmail(
        token: string,
        companyNumber: string,
        signatoryId: string
    ): Promise<string | undefined> {
        const dissolution = await this.client.getDissolution(token, companyNumber);
        const signatory = dissolution?.directors.find(d => d.officer_id === signatoryId);
        return signatory?.email;
    }

    public async getDissolutionPaymentSummary(
        dissolutionSession: DissolutionSession,
        dissolution: DissolutionGetResponse
    ): Promise<PaymentSummary> {
        if (dissolutionSession.transactionId) {
            return {
                payments: [
                    {
                        description:
                            this.paymentDescription +
                            " " +
                            dissolution.company_name +
                            " (" +
                            dissolutionSession.companyNumber +
                            ")",
                        cost: convertToCurrency(Number(this.fee)),
                    },
                ],
                total_cost: convertToCurrency(Number(this.fee)),
            };
        }
        const applicationReference: string = dissolutionSession.applicationReferenceNumber!;

        const dissolutionGetPaymentUIData: DissolutionGetPaymentUIData =
            await this.client.getDissolutionPaymentUIData(applicationReference);

        return this.paymentMapper.mapToPaymentSummary(dissolutionGetPaymentUIData);
    }

    public async addPayByAccountPaymentData(
        dissolutionSession: DissolutionSession,
        accountNumber: string
    ): Promise<void> {
        const applicationReference: string = dissolutionSession.applicationReferenceNumber!;

        const dissolutionPaymentPatchRequest: DissolutionPaymentPatchRequest =
            this.paymentMapper.mapToPayByAccountPaymentPatchRequest(dissolutionSession, accountNumber);

        return await this.client.patchDissolutionPaymentData(applicationReference, dissolutionPaymentPatchRequest);
    }

    public async approveDissolution(req: Request, dissolution: DissolutionSession, ipAddress: string): Promise<void> {
        const token: string = this.session.getAccessToken(req);
        const body: DissolutionPatchRequest = this.dissolutionRequestMapper.mapToDissolutionPatchRequest(
            dissolution.approval!.officerId,
            ipAddress
        );

        if (hasCompanyNumberAndTransactionIdInRequest(req)) {
            const { companyNumber, transactionId } = getCompanyNumberAndTransactionIdFromRequest(req);
            return this.client.patchDissolutionApproval(token, companyNumber, transactionId, body);
        }
        await this.client.patchDissolution(token, dissolution.companyNumber, body);
    }

    public async generateDissolutionCertificateUrl(confirmation: DissolutionConfirmation): Promise<string> {
        return this.certificateService.generateDissolutionCertificateUrl(confirmation);
    }

    public async createDraftDissolution(token: string, companyNumber: string, transactionId: string): Promise<string> {
        const response: DissolutionCreateDraftResponse = await this.client.createDraftDissolution(
            token,
            companyNumber,
            transactionId
        );
        return response.dissolution_id;
    }

    public async initiateDissolution(req: Request, dissolutionSession: DissolutionSession): Promise<void> {
        const token: string = this.session.getAccessToken(req);
        const { companyNumber, transactionId } = getCompanyNumberAndTransactionIdFromRequest(req);
        const body: DissolutionInitiationRequest =
            this.dissolutionRequestMapper.mapToDissolutionRequest(dissolutionSession);

        await this.client.initiateDissolution(token, companyNumber, transactionId, body);
    }

    public async resendSignatoryNotification(req: Request, officerId: string): Promise<boolean> {
        const token: string = this.session.getAccessToken(req);
        const { companyNumber, transactionId } = getCompanyNumberAndTransactionIdFromRequest(req);

        const response: DissolutionGetResendEmailResponse = await this.client.resendSignatoryNotification(
            token,
            companyNumber,
            transactionId,
            officerId
        );

        return response.reminderSent;
    }
}
