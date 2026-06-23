import { assert } from "chai";

import { getEnv, getEnvOr, getEnvOrDefault, getEnvOrThrow, parseFeatureFlag } from "app/utils/env.util";

describe("Env Util", () => {
    const testVariable = "TEST_VAR";
    const testValue = "4000";

    beforeEach(() => {
        delete process.env[testVariable];
    });

    describe("getEnv", () => {
        it("should return environment variable if set", () => {
            process.env[testVariable] = testValue;
            assert.equal(getEnv(testVariable), testValue);
        });

        it("should return undefined if environment variable is not set", () => {
            assert.isUndefined(getEnv(testVariable));
        });
    });

    describe("getEnvOr", () => {
        it("should return environment variable if set", () => {
            process.env[testVariable] = testValue;
            assert.equal(getEnvOr(testVariable, null as any), testValue);
        });

        it("should invoke callback function if environment variable is not set", () => {
            assert.equal(
                getEnvOr(testVariable, () => testValue),
                testValue
            );
        });
    });

    describe("getEnvOrDefault", () => {
        it("should return environment variable if set", () => {
            process.env[testVariable] = testValue;
            assert.equal(getEnvOrDefault(testVariable, null as any), testValue);
        });

        it("should return default value if environment variable is not set", () => {
            assert.equal(getEnvOrDefault(testVariable, testValue), testValue);
        });
    });

    describe("getEnvOrThrow", () => {
        it("should return environment variable if set", () => {
            process.env[testVariable] = testValue;
            assert.equal(getEnvOrThrow(testVariable), testValue);
        });

        it("should throw an exception if environment variable is not set", () => {
            assert.throw(
                () => {
                    getEnvOrThrow(testValue);
                },
                Error,
                `Variable ${testValue} was not found`
            );
        });
    });

    describe("parseFeatureFlag", () => {
        it("should return true if variable is 'on'", function () {
            assert.isTrue(parseFeatureFlag("on"));
        });

        it("should return true if variable is 'ON'", function () {
            assert.isTrue(parseFeatureFlag("ON"));
        });

        it("should return true if variable is 'true'", function () {
            assert.isTrue(parseFeatureFlag("true"));
        });

        it("should return true if variable is 'TRUE'", function () {
            assert.isTrue(parseFeatureFlag("TRUE"));
        });

        it("should return true if variable is '1'", function () {
            assert.isTrue(parseFeatureFlag("1"));
        });

        it("should return true if variable is 'yes'", function () {
            assert.isTrue(parseFeatureFlag("yes"));
        });

        it("should return true if variable is 'YES'", function () {
            assert.isTrue(parseFeatureFlag("YES"));
        });

        it("should return false if variable is 'false'", function () {
            assert.isFalse(parseFeatureFlag("false"));
        });

        it("should return false if variable is '0'", function () {
            assert.isFalse(parseFeatureFlag("0"));
        });

        it("should return false if variable is empty string", function () {
            assert.isFalse(parseFeatureFlag(""));
        });

        it("should return false if variable is undefined", function () {
            assert.isFalse(parseFeatureFlag(undefined));
        });

        it("should return false if variable is random string", function () {
            assert.isFalse(parseFeatureFlag("asdfghjkl"));
        });

        it("should return false if variable is 'off'", function () {
            assert.isFalse(parseFeatureFlag("off"));
        });

        it("should return false if variable is 'OFF'", function () {
            assert.isFalse(parseFeatureFlag("OFF"));
        });
    });
});
