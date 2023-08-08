import { ValidationResult } from "@hapi/joi";
import { assert } from "chai";
import { generatePayByAccountDetailsForm } from "../fixtures/payment.fixtures";

import PayByAccountDetailsFormModel from "app/models/form/payByAccountDetails.model";
import payByAccountDetailsSchema from "app/schemas/payByAccountDetails.schema";

describe("Pay By Account Schema", () => {
    it("should return no errors when data is valid", () => {
        const validForm: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm();

        const errors: ValidationResult = payByAccountDetailsSchema.validate(validForm);

        assert.isUndefined(errors.error);
    });

    it("should return an error when a presenter ID is not provided", () => {
        const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm();
        form.presenterId = undefined;

        const errors: ValidationResult = payByAccountDetailsSchema.validate(form);

        assert.isDefined(errors.error);
        assert.equal(errors.error!.details.length, 1);
        assert.equal(errors.error!.details[0].context!.key, "presenterId");
        assert.equal(errors.error!.details[0].type, `any.required`);
        assert.equal(errors.error!.details[0].message, "You must enter a Presenter ID");
    });

    it("should return an error when an empty presenter ID is provided", () => {
        const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm();
        form.presenterId = "";

        const errors: ValidationResult = payByAccountDetailsSchema.validate(form);

        assert.isDefined(errors.error);
        assert.equal(errors.error!.details.length, 1);
        assert.equal(errors.error!.details[0].context!.key, "presenterId");
        assert.equal(errors.error!.details[0].type, `string.empty`);
        assert.equal(errors.error!.details[0].message, "You must enter a Presenter ID");
    });

    it("should return an error when a presenter auth code is not provided", () => {
        const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm();
        form.presenterAuthCode = undefined;

        const errors: ValidationResult = payByAccountDetailsSchema.validate(form);

        assert.isDefined(errors.error);
        assert.equal(errors.error!.details.length, 1);
        assert.equal(errors.error!.details[0].context!.key, "presenterAuthCode");
        assert.equal(errors.error!.details[0].type, `any.required`);
        assert.equal(errors.error!.details[0].message, "You must enter a Presenter authentication code");
    });

    it("should return an error when an empty presenter auth code is provided", () => {
        const form: PayByAccountDetailsFormModel = generatePayByAccountDetailsForm();
        form.presenterAuthCode = "";

        const errors: ValidationResult = payByAccountDetailsSchema.validate(form);

        assert.isDefined(errors.error);
        assert.equal(errors.error!.details.length, 1);
        assert.equal(errors.error!.details[0].context!.key, "presenterAuthCode");
        assert.equal(errors.error!.details[0].type, `string.empty`);
        assert.equal(errors.error!.details[0].message, "You must enter a Presenter authentication code");
    });
});
