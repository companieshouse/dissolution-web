import { assert } from "chai";

import { ROUTE_PARAM_COMPANY_NUMBER, ROUTE_PARAM_TRANSACTION_ID } from "app/constants/app.const";
import {
    hasCompanyNumberAndTransactionIdInRequest,
    getCompanyNumberAndTransactionIdFromRequest,
    getCompanyNumberFromRequestParams,
    getTransactionIdFromRequestParams,
} from "app/utils/transaction.util";
import { aRequestWith } from "test/fixtures/http.fixtures";

describe("transaction.util", () => {
    const COMPANY_NUMBER = "12345678";
    const TRANSACTION_ID = "111111-222222-333333";

    describe("getTransactionIdFromRequestParams", () => {
        it("should return the transaction id from the route params", () => {
            assert.equal(
                getTransactionIdFromRequestParams(
                    aRequestWith({
                        [ROUTE_PARAM_COMPANY_NUMBER]: COMPANY_NUMBER,
                        [ROUTE_PARAM_TRANSACTION_ID]: TRANSACTION_ID,
                    })
                ),
                TRANSACTION_ID
            );
        });

        it("should return undefined when the transaction id is missing", () => {
            assert.isUndefined(getTransactionIdFromRequestParams(aRequestWith({})));
        });
    });

    describe("getCompanyNumberFromRequestParams", () => {
        it("should return the company number from the route params", () => {
            assert.equal(
                getCompanyNumberFromRequestParams(
                    aRequestWith({
                        [ROUTE_PARAM_COMPANY_NUMBER]: COMPANY_NUMBER,
                        [ROUTE_PARAM_TRANSACTION_ID]: TRANSACTION_ID,
                    })
                ),
                COMPANY_NUMBER
            );
        });

        it("should return undefined when the company number is missing", () => {
            assert.isUndefined(getCompanyNumberFromRequestParams(aRequestWith({})));
        });
    });

    describe("companyNumberAndTransactionIdExistInRequest", () => {
        it("should return true when both params are present", () => {
            assert.isTrue(
                hasCompanyNumberAndTransactionIdInRequest(
                    aRequestWith({
                        [ROUTE_PARAM_COMPANY_NUMBER]: COMPANY_NUMBER,
                        [ROUTE_PARAM_TRANSACTION_ID]: TRANSACTION_ID,
                    })
                )
            );
        });

        it("should return false when only the company number is present", () => {
            const req = aRequestWith({ [ROUTE_PARAM_COMPANY_NUMBER]: COMPANY_NUMBER });
            assert.isFalse(hasCompanyNumberAndTransactionIdInRequest(req));
        });

        it("should return false when only the transaction id is present", () => {
            const req = aRequestWith({ [ROUTE_PARAM_TRANSACTION_ID]: TRANSACTION_ID });
            assert.isFalse(hasCompanyNumberAndTransactionIdInRequest(req));
        });

        it("should return false when neither param is present", () => {
            assert.isFalse(hasCompanyNumberAndTransactionIdInRequest(aRequestWith({})));
        });
    });

    describe("getCompanyNumberAndTransactionIdFromRequest", () => {
        it("should return the company number and transaction id when both are present", () => {
            assert.deepEqual(
                getCompanyNumberAndTransactionIdFromRequest(
                    aRequestWith({
                        [ROUTE_PARAM_COMPANY_NUMBER]: COMPANY_NUMBER,
                        [ROUTE_PARAM_TRANSACTION_ID]: TRANSACTION_ID,
                    })
                ),
                {
                    companyNumber: COMPANY_NUMBER,
                    transactionId: TRANSACTION_ID,
                }
            );
        });

        it("should throw when the transaction id is missing", () => {
            const req = aRequestWith({ [ROUTE_PARAM_COMPANY_NUMBER]: COMPANY_NUMBER });
            assert.throws(
                () => getCompanyNumberAndTransactionIdFromRequest(req),
                "Company number and transaction ID are required"
            );
        });

        it("should throw when the company number is missing", () => {
            const req = aRequestWith({ [ROUTE_PARAM_TRANSACTION_ID]: TRANSACTION_ID });
            assert.throws(
                () => getCompanyNumberAndTransactionIdFromRequest(req),
                "Company number and transaction ID are required"
            );
        });
    });
});
