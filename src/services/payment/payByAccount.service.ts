import "reflect-metadata";

import { AxiosError } from "axios";
import { StatusCodes } from "http-status-codes";
import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";

import PayByAccountMapper from "app/mappers/payment/payByAccount.mapper";
import PresenterAuthRequest from "app/models/dto/presenterAuthRequest";
import PresenterAuthResponse from "app/models/dto/presenterAuthResponse";
import PayByAccountDetailsFormModel from "app/models/form/payByAccountDetails.model";
import Optional from "app/models/optional";
import PresenterApiClient from "app/services/clients/presenterApi.client";

@provide(PayByAccountService)
export default class PayByAccountService {

    public constructor (
    @inject(PayByAccountMapper) private mapper: PayByAccountMapper,
    @inject(PresenterApiClient) private client: PresenterApiClient) {}

    public async getAccountNumber (form: PayByAccountDetailsFormModel): Promise<Optional<string>> {
        const request: PresenterAuthRequest = this.mapper.mapToPresenterAuthRequest(form);

        try {
            const response: PresenterAuthResponse = await this.client.getAccountNumber(request);
            return response.presenterAccountNumber;
        } catch (err: any) {
            if (this.areCredentialsIncorrect(err)) {
                return null;
            }

            return Promise.reject(err);
        }
    }

    private areCredentialsIncorrect (err: Error | AxiosError): boolean {
        return this.isAxiosError(err) && err.response?.status === StatusCodes.UNAUTHORIZED;
    }

    private isAxiosError (err: Error | AxiosError): err is AxiosError {
        return (err as AxiosError).isAxiosError;
    }
}
