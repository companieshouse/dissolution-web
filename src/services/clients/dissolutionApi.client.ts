import "reflect-metadata";

import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";

import { DissolutionCreateRequest, DissolutionInitiationRequest } from "app/models/dto/dissolutionCreateRequest";
import DissolutionCreateResponse from "app/models/dto/dissolutionCreateResponse";
import DissolutionDirectorPatchRequest from "app/models/dto/dissolutionDirectorPatchRequest";
import DissolutionGetPaymentUIData from "app/models/dto/dissolutionGetPaymentUIData";
import DissolutionGetResendEmailResponse from "app/models/dto/dissolutionGetResendEmailResponse";
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse";
import DissolutionPatchRequest from "app/models/dto/dissolutionPatchRequest";
import DissolutionPatchResponse from "app/models/dto/dissolutionPatchResponse";
import DissolutionPaymentPatchRequest from "app/models/dto/dissolutionPaymentPatchRequest";
import Optional from "app/models/optional";
import TYPES from "app/types";

import DissolutionCreateDraftResponse from "app/models/dto/dissolutionCreateDraftResponse";
import { StatusCodes } from "http-status-codes";
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger";

@provide(DissolutionApiClient)
export class DissolutionApiClient {
    public constructor(
        @inject(TYPES.DISSOLUTIONS_API_URL) private readonly DISSOLUTIONS_API_URL: string,
        @inject(TYPES.CHS_API_KEY) private readonly CHS_API_KEY: string,
        @inject(TYPES.AxiosInstance) private readonly axios: AxiosInstance,
        @inject(ApplicationLogger) private readonly logger: ApplicationLogger
    ) {}

    public async createDissolution(
        token: string,
        companyNumber: string,
        body: DissolutionCreateRequest
    ): Promise<DissolutionCreateResponse> {
        const response: AxiosResponse<DissolutionCreateResponse> = await this.axios.post(
            this.generateUrl(companyNumber),
            body,
            this.generateConfigForOAuth(token)
        );

        return response.data;
    }

    public async getDissolution(token: string, companyNumber: string): Promise<Optional<DissolutionGetResponse>> {
        try {
            const response: Optional<AxiosResponse<DissolutionGetResponse>> = await this.axios.get(
                this.generateUrl(companyNumber),
                this.generateConfigForOAuth(token)
            );

            return response!.data;
        } catch (err: any) {
            if (err.response.status === 404) {
                return null;
            }

            return Promise.reject(err);
        }
    }

    public async sendEmailNotification(
        companyNumber: string,
        directorEmail: string
    ): Promise<DissolutionGetResendEmailResponse> {
        const response: AxiosResponse<DissolutionGetResendEmailResponse> = await this.axios.post(
            `${this.DISSOLUTIONS_API_URL}/dissolution-request/${companyNumber}/resend-email/${directorEmail}`,
            companyNumber,
            this.generateConfigForAPIKey()
        );

        return { reminderSent: response.status === 200 };
    }

    public async getDissolutionPaymentUIData(applicationReference: string): Promise<DissolutionGetPaymentUIData> {
        const response: AxiosResponse<DissolutionGetPaymentUIData> = await this.axios.get(
            `${this.DISSOLUTIONS_API_URL}/dissolution-request/${applicationReference}/payment`,
            this.generateConfigForAPIKey()
        );

        return response.data;
    }

    public async patchDissolution(
        token: string,
        companyNumber: string,
        body: DissolutionPatchRequest
    ): Promise<DissolutionPatchResponse> {
        const response: AxiosResponse<DissolutionPatchResponse> = await this.axios.patch(
            this.generateUrl(companyNumber),
            body,
            this.generateConfigForOAuth(token)
        );

        return response.data;
    }

    public async patchDissolutionDirector(
        token: string,
        companyNumber: string,
        directorId: string,
        body: DissolutionDirectorPatchRequest
    ): Promise<void> {
        await this.axios.patch(
            this.generateUrlForDirector(companyNumber, directorId),
            body,
            this.generateConfigForOAuth(token)
        );
    }

    /**
     * @deprecated: This method is only used for the legacy dissolution journey and will be removed in the future
     */
    public async patchDissolutionPaymentData(
        applicationReference: string,
        body: DissolutionPaymentPatchRequest
    ): Promise<void> {
        return await this.axios.patch(
            `${this.DISSOLUTIONS_API_URL}/dissolution-request/${applicationReference}/payment`,
            body,
            this.generateConfigForAPIKey()
        );
    }

    public async createDraftDissolution(
        token: string,
        companyNumber: string,
        transactionId: string
    ): Promise<DissolutionCreateDraftResponse> {
        const response: AxiosResponse<DissolutionCreateDraftResponse> = await this.axios.post(
            this.generateTxModelUrl(companyNumber, transactionId),
            undefined,
            this.generateConfigForOAuth(token)
        );

        return response.data;
    }

    public async initiateDissolution(
        token: string,
        companyNumber: string,
        transactionId: string,
        body: DissolutionInitiationRequest
    ): Promise<void> {
        await this.axios.post(
            this.generateTxModelUrl(companyNumber, transactionId, "initiation"),
            body,
            this.generateConfigForOAuth(token)
        );
    }

    public async patchDissolutionApproval(
        token: string,
        companyNumber: string,
        transactionId: string,
        body: DissolutionPatchRequest
    ): Promise<void> {
        await this.axios.patch(
            this.generateTxModelUrl(companyNumber, transactionId, "approve"),
            body,
            this.generateConfigForOAuth(token)
        );
    }

    public async resendSignatoryNotification(
        token: string,
        companyNumber: string,
        transactionId: string,
        officerId: string
    ): Promise<DissolutionGetResendEmailResponse> {
        const url = this.generateTxModelUrlForSignatories(
            companyNumber,
            transactionId,
            officerId,
            "signature-notification"
        );
        try {
            const response: AxiosResponse = await this.axios.post(url, undefined, this.generateConfigForOAuth(token));
            return { reminderSent: response.status === StatusCodes.OK };
        } catch (err: any) {
            this.logger.error(
                `Failed to resend signatory notification: status=${err?.response?.status ?? "none"}, message=${err?.message}`
            );

            if (this.isNonRetryable(err)) {
                throw err;
            }
            return { reminderSent: false };
        }
    }

    public async updateSignatoryDetails(
        token: string,
        companyNumber: string,
        transactionId: string,
        officerId: string,
        body: DissolutionDirectorPatchRequest
    ): Promise<void> {
        await this.axios.patch(
            this.generateTxModelUrlForSignatories(companyNumber, transactionId, officerId),
            body,
            this.generateConfigForOAuth(token)
        );
    }

    private generateConfigForOAuth(token: string): AxiosRequestConfig {
        return {
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        };
    }

    private generateConfigForAPIKey(): AxiosRequestConfig {
        return {
            headers: {
                Authorization: this.CHS_API_KEY,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        };
    }

    private generateUrl(companyNumber: string): string {
        return `${this.DISSOLUTIONS_API_URL}/dissolution-request/${companyNumber}`;
    }

    private generateUrlForDirector(companyNumber: string, directorId: string): string {
        return `${this.generateUrl(companyNumber)}/directors/${directorId}`;
    }

    private generateTxModelUrl(companyNumber: string, transactionId: string, suffix?: string): string {
        const url = `${this.DISSOLUTIONS_API_URL}/company/${encodeURIComponent(companyNumber)}/transactions/${encodeURIComponent(transactionId)}/dissolution`;
        if (suffix) {
            return `${url}/${suffix}`;
        }
        return url;
    }

    private generateTxModelUrlForSignatories(
        companyNumber: string,
        transactionId: string,
        officerId: string,
        suffix?: string
    ): string {
        const url = this.generateTxModelUrl(companyNumber, transactionId, `signatories/${officerId}`);
        if (suffix) {
            return `${url}/${suffix}`;
        }
        return url;
    }

    // 4xx errors will not be retried, 5xx errors and network errors will be retried
    private isNonRetryable(err: any): boolean {
        if (!this.isAxiosError(err)) {
            return true;
        }

        const status = err.response?.status;
        return status !== undefined && status >= StatusCodes.BAD_REQUEST && status < StatusCodes.INTERNAL_SERVER_ERROR;
    }

    private isAxiosError(err: Error | AxiosError): err is AxiosError {
        return (err as AxiosError).isAxiosError;
    }
}
