import { ValidationResult } from "joi";
import { assert } from "chai";
import transactionIdSchema from "app/schemas/transactionId.schema";

describe("Transaction ID Schema", () => {
    const VALID_TRANSACTION_ID = "123456-123456-123456";

    it("should return no errors when transaction ID is valid", () => {
        const result: ValidationResult = transactionIdSchema.validate(VALID_TRANSACTION_ID);

        assert.isUndefined(result.error);
        assert.equal(result.value, VALID_TRANSACTION_ID);
    });

    it("should trim surrounding whitespace and return no errors", () => {
        const result: ValidationResult = transactionIdSchema.validate(`  ${VALID_TRANSACTION_ID}  `);

        assert.isUndefined(result.error);
        assert.equal(result.value, VALID_TRANSACTION_ID);
    });

    it("should return an error if transaction ID is not provided", () => {
        const result: ValidationResult = transactionIdSchema.validate(undefined);

        assert.isDefined(result.error);
        assert.equal(result.error!.details.length, 1);
        assert.equal(result.error!.details[0].type, "any.required");
    });

    ["", "   "].forEach(transactionId => {
        it(`should return an error if transaction ID is empty: "${transactionId}"`, () => {
            const result: ValidationResult = transactionIdSchema.validate(transactionId);

            assert.isDefined(result.error);
            assert.equal(result.error!.details.length, 1);
            assert.equal(result.error!.details[0].type, "string.empty");
        });
    });

    it("should return an error if transaction ID is not a string", () => {
        const result: ValidationResult = transactionIdSchema.validate(123456123456123456);

        assert.isDefined(result.error);
        assert.equal(result.error!.details.length, 1);
        assert.equal(result.error!.details[0].type, "string.base");
    });

    [
        "invalid",
        "123456-123456",
        "123456123456123456",
        "12345-123456-123456",
        "1234567-123456-123456",
        "123456-123456-1234567",
        "abcdef-123456-123456",
        "123456_123456_123456",
        "123456-123456-123456-123456",
        "123456 -123456-123456",
        "１２３４５６-123456-123456",
    ].forEach(transactionId => {
        it(`should return an error if transaction ID does not match the required pattern: "${transactionId}"`, () => {
            const result: ValidationResult = transactionIdSchema.validate(transactionId);

            assert.isDefined(result.error);
            assert.equal(result.error!.details.length, 1);
            assert.equal(result.error!.details[0].type, "string.pattern.base");
        });
    });
});
