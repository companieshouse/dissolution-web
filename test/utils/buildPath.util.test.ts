import "reflect-metadata";

import { assert } from "chai";

import {
    APPLICATION_STATUS_CHANGE_URI,
    CHECK_YOUR_ANSWERS_URI,
    NOT_SELECTED_SIGNATORY,
    PAY_BY_ACCOUNT_CHANGE_PAYMENT_TYPE_URI,
    SELECT_DIRECTOR_URI,
    VIEW_COMPANY_INFORMATION_URI,
} from "app/paths";
import { buildPath } from "app/utils/buildPath";

function exactMissingParamsError(template: string, missing: string[]): RegExp {
    const message = `Missing route params for path "${template}": ${missing.join(", ")}`;
    return new RegExp(`^${message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
}

describe("buildPath", () => {
    describe("required params", () => {
        it("when all params provided then replaces placeholders and encodes values", () => {
            const result = buildPath("/foo/:id/bar/:name", { id: "123", name: "A B" });

            assert.equal(result, "/foo/123/bar/A%20B");
        });

        it("when param contains characters that need encoding then returns encoded segment", () => {
            const result = buildPath("/items/:sku", { sku: "a/b?c&d" });

            assert.equal(result, "/items/a%2Fb%3Fc%26d");
        });

        it("when numeric param provided then converts to string", () => {
            const result = buildPath("/count/:num", { num: 42 });

            assert.equal(result, "/count/42");
        });

        it("when numeric param is zero then treats it as a provided value", () => {
            const result = buildPath("/count/:num", { num: 0 });

            assert.equal(result, "/count/0");
        });

        it("when the same param appears multiple times then replaces every occurrence", () => {
            const result = buildPath("/a/:id/b/:id", { id: "1" });

            assert.equal(result, "/a/1/b/1");
        });

        it("when param names share a prefix then replaces each param by its full name", () => {
            const result = buildPath("/a/:idType", { id: "1", idType: "x" });

            assert.equal(result, "/a/x");
        });

        it("when extra params are provided then ignores them", () => {
            const result = buildPath("/a/:id", { id: "1", unused: "2" });

            assert.equal(result, "/a/1");
        });

        it("when template has no placeholders then returns it unchanged", () => {
            const result = buildPath("/close-a-company/healthcheck", {});

            assert.equal(result, "/close-a-company/healthcheck");
        });

        it("when param value contains a colon then encodes it and does not treat it as a placeholder", () => {
            const result = buildPath("/a/:id", { id: ":other" });

            assert.equal(result, "/a/%3Aother");
        });
    });

    describe("missing params", () => {
        it("when a required param is missing then throws an informative error", () => {
            const template = "/one/:present/two/:missing";

            assert.throws(
                () => buildPath(template, { present: "x" }),
                Error,
                exactMissingParamsError(template, [":missing"])
            );
        });

        it("when multiple required params are missing then lists all of them in order", () => {
            const template = "/:a/:b/:c";

            assert.throws(
                () => buildPath(template, { b: "x" }),
                Error,
                exactMissingParamsError(template, [":a", ":c"])
            );
        });

        it("when a required param is undefined then throws", () => {
            const template = "/a/:id";

            assert.throws(
                () => buildPath(template, { id: undefined }),
                Error,
                exactMissingParamsError(template, [":id"])
            );
        });

        it("when a required param is an empty string then throws", () => {
            const template = "/a/:id";

            assert.throws(() => buildPath(template, { id: "" }), Error, exactMissingParamsError(template, [":id"]));
        });
    });

    describe("optional groups", () => {
        const template = "/company/:companyNumber/(transactions/:transactionId/)?select-director";

        it("when the group param is provided then includes the group contents", () => {
            const result = buildPath(template, { companyNumber: "123", transactionId: "t1" });

            assert.equal(result, "/company/123/transactions/t1/select-director");
        });

        it("when the group param is omitted then removes the group", () => {
            const result = buildPath(template, { companyNumber: "123" });

            assert.equal(result, "/company/123/select-director");
        });

        it("when the group param is undefined then removes the group", () => {
            const result = buildPath(template, { companyNumber: "123", transactionId: undefined });

            assert.equal(result, "/company/123/select-director");
        });

        it("when the group param is an empty string then removes the group", () => {
            const result = buildPath(template, { companyNumber: "123", transactionId: "" });

            assert.equal(result, "/company/123/select-director");
        });

        it("when the group param needs encoding then encodes it", () => {
            const result = buildPath(template, { companyNumber: "123", transactionId: "a b/c" });

            assert.equal(result, "/company/123/transactions/a%20b%2Fc/select-director");
        });

        it("when the group param is numeric then converts it to string", () => {
            const result = buildPath(template, { companyNumber: "123", transactionId: 99 });

            assert.equal(result, "/company/123/transactions/99/select-director");
        });

        it("when a group has multiple params and all are provided then includes the group", () => {
            const result = buildPath("/start/(a/:x/b/:y/)?end", { x: "1", y: "2" });

            assert.equal(result, "/start/a/1/b/2/end");
        });

        it("when a group has multiple params and only some are provided then removes the whole group without throwing", () => {
            const result = buildPath("/start/(a/:x/b/:y/)?end", { x: "1" });

            assert.equal(result, "/start/end");
        });

        it("when there are multiple groups then resolves each one independently", () => {
            const multiGroupTemplate = "/start/(a/:x/)?(b/:y/)?end";

            assert.equal(buildPath(multiGroupTemplate, {}), "/start/end");
            assert.equal(buildPath(multiGroupTemplate, { x: "1" }), "/start/a/1/end");
            assert.equal(buildPath(multiGroupTemplate, { y: "2" }), "/start/b/2/end");
            assert.equal(buildPath(multiGroupTemplate, { x: "1", y: "2" }), "/start/a/1/b/2/end");
        });

        it("when a group contains no params then always includes its contents", () => {
            const result = buildPath("/start/(static/)?end", {});

            assert.equal(result, "/start/static/end");
        });

        it("when parentheses are not followed by '?' then leaves them untouched", () => {
            const result = buildPath("/start/(literal)/:id", { id: "1" });

            assert.equal(result, "/start/(literal)/1");
        });

        it("when a required param outside the group is missing and the group is removed then reports only the required param", () => {
            assert.throws(() => buildPath(template, {}), Error, exactMissingParamsError(template, [":companyNumber"]));
        });

        it("when a required param outside the group is missing and the group is kept then reports only the required param", () => {
            assert.throws(
                () => buildPath(template, { transactionId: "t1" }),
                Error,
                exactMissingParamsError(template, [":companyNumber"])
            );
        });

        it("when called repeatedly then returns consistent results", () => {
            const withTransaction = { companyNumber: "123", transactionId: "t1" };
            const withoutTransaction = { companyNumber: "123" };

            assert.equal(buildPath(template, withTransaction), "/company/123/transactions/t1/select-director");
            assert.equal(buildPath(template, withoutTransaction), "/company/123/select-director");
            assert.equal(buildPath(template, withTransaction), "/company/123/transactions/t1/select-director");
            assert.equal(buildPath(template, withoutTransaction), "/company/123/select-director");
        });
    });

    describe("application paths", () => {
        const journeyParams = { journeyId: "j1", companyNumber: "12345678" };
        const transactionParams = { ...journeyParams, transactionId: "t1" };

        it("when building SELECT_DIRECTOR_URI with a transactionId then includes the transactions segment", () => {
            const result = buildPath(SELECT_DIRECTOR_URI, transactionParams);

            assert.equal(result, "/close-a-company/j1/company/12345678/transactions/t1/select-director");
        });

        it("when building SELECT_DIRECTOR_URI without a transactionId then omits the transactions segment", () => {
            const result = buildPath(SELECT_DIRECTOR_URI, journeyParams);

            assert.equal(result, "/close-a-company/j1/company/12345678/select-director");
        });

        it("when building a nested path with a trailing param and a transactionId then resolves both", () => {
            const result = buildPath(APPLICATION_STATUS_CHANGE_URI, { ...transactionParams, signatoryId: "s1" });

            assert.equal(result, "/close-a-company/j1/company/12345678/transactions/t1/application-status/s1/change");
        });

        it("when building a nested path with a trailing param and no transactionId then omits the transactions segment", () => {
            const result = buildPath(APPLICATION_STATUS_CHANGE_URI, { ...journeyParams, signatoryId: "s1" });

            assert.equal(result, "/close-a-company/j1/company/12345678/application-status/s1/change");
        });

        it("when building a multi-level payment path without a transactionId then omits the transactions segment", () => {
            const result = buildPath(PAY_BY_ACCOUNT_CHANGE_PAYMENT_TYPE_URI, journeyParams);

            assert.equal(result, "/close-a-company/j1/company/12345678/payment/pay-by-account/change-payment-type");
        });

        it("when building a company-scoped path with a transactionId then ignores the transactionId", () => {
            const result = buildPath(VIEW_COMPANY_INFORMATION_URI, transactionParams);

            assert.equal(result, "/close-a-company/j1/company/12345678/view-company-information");
        });

        [SELECT_DIRECTOR_URI, CHECK_YOUR_ANSWERS_URI, NOT_SELECTED_SIGNATORY, APPLICATION_STATUS_CHANGE_URI].forEach(
            template => {
                it(`when building ${template} then leaves no route syntax in the result`, () => {
                    const params = { signatoryId: "s1" };

                    assert.notMatch(buildPath(template, { ...journeyParams, ...params }), /[():?]/);
                    assert.notMatch(buildPath(template, { ...transactionParams, ...params }), /[():?]/);
                });
            }
        );
    });
});
