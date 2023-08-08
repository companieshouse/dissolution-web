import { ValidationResult } from "@hapi/joi";
import { assert } from "chai";
import { generateHowDoYouWantToPayForm } from "../fixtures/payment.fixtures";

import PaymentType from "app/models/dto/paymentType.enum";
import HowDoYouWantToPayForm from "app/models/form/howDoYouWantToPay.model";
import { howDoYouWantToPaySchema, ERROR_MESSAGE } from "app/schemas/howDoYouWantToPay.schema";

describe("How do you want to pay Schema", () => {

    it("should return no errors when data is valid", () => {
        const validForm: HowDoYouWantToPayForm = generateHowDoYouWantToPayForm();
        validForm.paymentType = PaymentType.ACCOUNT;

        const errors: ValidationResult = howDoYouWantToPaySchema.validate(validForm);

        assert.isUndefined(errors.error);
    });

    it("should return errors when data has empty paymentType", () => {
        const invalidForm: HowDoYouWantToPayForm = generateHowDoYouWantToPayForm();
        invalidForm.paymentType = undefined;

        const errors: ValidationResult = howDoYouWantToPaySchema.validate(invalidForm);

        assert.deepEqual(errors.value, invalidForm);
        assert.equal(errors.error!.details.length, 1);
        assert.equal(errors.error!.details[0].context!.key, "paymentType");
        assert.equal(errors.error!.message, ERROR_MESSAGE);
    });

    it("should return errors when data has invalid paymentType", () => {
        const invalidForm: HowDoYouWantToPayForm = generateHowDoYouWantToPayForm();
        invalidForm.paymentType = "notARealPaymentType" as PaymentType;

        const errors: ValidationResult = howDoYouWantToPaySchema.validate(invalidForm);

        assert.deepEqual(errors.value, invalidForm);
        assert.equal(errors.error!.details.length, 1);
        assert.equal(errors.error!.details[0].context!.key, "paymentType");
        assert.equal(errors.error!.message, ERROR_MESSAGE);
    });
});
