import CompanyOfficersService from "@companieshouse/api-sdk-node/dist/services/company-officers/service";
import { CompanyOfficers } from "@companieshouse/api-sdk-node/dist/services/company-officers/types";
import Resource from "@companieshouse/api-sdk-node/dist/services/resource";
import { assert } from "chai";
import { instance, mock, when } from "ts-mockito";
import { generateCompanyOfficersResource } from "../../fixtures/companyOfficers.fixtures";
import { TOKEN } from "../../fixtures/session.fixtures";

import APIClientFactory from "app/services/clients/apiClient.factory";
import CompanyOfficersClient from "app/services/clients/companyOfficers.client";

describe("CompanyOfficersClient", () => {

    let companyOfficersClient: CompanyOfficersClient;

    let factory: APIClientFactory;
    let companyOfficersService: CompanyOfficersService;

    const COMPANY_NUMBER = "12345678";

    beforeEach(() => {
        factory = mock(APIClientFactory);
        companyOfficersService = mock(CompanyOfficersService);

        companyOfficersClient = new CompanyOfficersClient(instance(factory));
    });

    describe("getCompanyOfficers", () => {
        it("should fetch and return the company officers for the provided company number", async () => {
            const response: Resource<CompanyOfficers> = generateCompanyOfficersResource();

            when(companyOfficersService.getCompanyOfficers(COMPANY_NUMBER)).thenResolve(response);
            when(factory.getCompanyOfficersService(TOKEN)).thenReturn(instance(companyOfficersService));

            const result: Resource<CompanyOfficers> = await companyOfficersClient.getCompanyOfficers(TOKEN, COMPANY_NUMBER);

            assert.equal(result, response);
        });
    });
});
