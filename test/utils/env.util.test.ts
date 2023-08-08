import { assert } from "chai";

import { getEnv, getEnvOr, getEnvOrDefault, getEnvOrThrow } from "app/utils/env.util";

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
            assert.equal(getEnvOr(testVariable, () => testValue), testValue);
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
            assert.throw(() => {
                getEnvOrThrow(testValue);
            }, Error, `Variable ${testValue} was not found`);
        });
    });
});
