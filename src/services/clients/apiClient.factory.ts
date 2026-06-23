import "reflect-metadata";

import { createApiClient } from "@companieshouse/api-sdk-node";
import CompanyOfficersService from "@companieshouse/api-sdk-node/dist/services/company-officers/service";
import CompanyProfileService from "@companieshouse/api-sdk-node/dist/services/company-profile/service";
import PaymentService from "@companieshouse/api-sdk-node/dist/services/payment/service";
import TransactionService from "@companieshouse/api-sdk-node/dist/services/transaction/service";
import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";

import TYPES from "app/types";

@provide(APIClientFactory)
export default class APIClientFactory {
    public constructor(
        @inject(TYPES.CHS_COMPANY_PROFILE_API_LOCAL_URL) private readonly COMPANY_PROFILE_API_URL: string,
        @inject(TYPES.PAYMENTS_API_URL) private readonly PAYMENTS_API_URL: string,
        @inject(TYPES.TRANSACTIONS_API_URL) private readonly TRANSACTIONS_API_URL: string
    ) {}

    public getCompanyProfileService(token: string): CompanyProfileService {
        return createApiClient(undefined, token, this.COMPANY_PROFILE_API_URL).companyProfile;
    }

    public getCompanyOfficersService(token: string): CompanyOfficersService {
        return createApiClient(undefined, token).companyOfficers;
    }

    public getPaymentService(token: string): PaymentService {
        return createApiClient(undefined, token, this.PAYMENTS_API_URL).payment;
    }

    public getTransactionService(token: string): TransactionService {
        return createApiClient(undefined, token, this.TRANSACTIONS_API_URL).transaction;
    }
}
