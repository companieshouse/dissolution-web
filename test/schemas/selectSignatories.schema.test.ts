import { ValidationResult } from "@hapi/joi";
import { assert } from "chai";
import { generateSelectSignatoriesFormModel } from "../fixtures/companyOfficers.fixtures";

import OfficerType from "app/models/dto/officerType.enum";
import SelectSignatoriesFormModel from "app/models/form/selectSignatories.model";
import selectSignatoriesSchema from "app/schemas/selectSignatories.schema";

describe("Select Signatories Schema", () => {

    it("should return no errors when data is valid", () => {
        const validForm: SelectSignatoriesFormModel = generateSelectSignatoriesFormModel("123");

        const errors: ValidationResult = selectSignatoriesSchema(OfficerType.DIRECTOR, 1).validate(validForm);

        assert.isUndefined(errors.error);
    });

    it("should return an error when no signatories are provided for DS01", () => {
        const invalidForm: SelectSignatoriesFormModel = generateSelectSignatoriesFormModel();
        invalidForm.signatories = undefined;

        const errors: ValidationResult = selectSignatoriesSchema(OfficerType.DIRECTOR, 3).validate(invalidForm);

        assert.isDefined(errors.error);
        assert.equal(errors.error!.details.length, 1);
        assert.equal(errors.error!.details[0].context!.key, "signatories");
        assert.equal(errors.error!.details[0].type, `any.required`);
        assert.equal(errors.error!.details[0].message, "Select the directors who will be signing the application.");
    });

    it("should return an error when no signatories are provided for LLDS01", () => {
        const invalidForm: SelectSignatoriesFormModel = generateSelectSignatoriesFormModel();
        invalidForm.signatories = undefined;

        const errors: ValidationResult = selectSignatoriesSchema(OfficerType.MEMBER, 3).validate(invalidForm);

        assert.isDefined(errors.error);
        assert.equal(errors.error!.details.length, 1);
        assert.equal(errors.error!.details[0].context!.key, "signatories");
        assert.equal(errors.error!.details[0].type, `any.required`);
        assert.equal(errors.error!.details[0].message, "Select the members who will be signing the application.");
    });

    it("should return an error when the minimum number of signatories is not provided for DS01", () => {
        const invalidForm: SelectSignatoriesFormModel = generateSelectSignatoriesFormModel("123", "456");

        const errors: ValidationResult = selectSignatoriesSchema(OfficerType.DIRECTOR, 3).validate(invalidForm);

        assert.isDefined(errors.error);
        assert.equal(errors.error!.details.length, 1);
        assert.equal(errors.error!.details[0].context!.key, "signatories");
        assert.equal(errors.error!.details[0].type, `array.min`);
        assert.equal(errors.error!.details[0].message, "Select more than half of the directors to sign the application.");
    });

    it("should return an error when the minimum number of signatories is not provided for LLDS01", () => {
        const invalidForm: SelectSignatoriesFormModel = generateSelectSignatoriesFormModel("123", "456");

        const errors: ValidationResult = selectSignatoriesSchema(OfficerType.MEMBER, 3).validate(invalidForm);

        assert.isDefined(errors.error);
        assert.equal(errors.error!.details.length, 1);
        assert.equal(errors.error!.details[0].context!.key, "signatories");
        assert.equal(errors.error!.details[0].type, `array.min`);
        assert.equal(errors.error!.details[0].message, "Select more than half of the members to sign the application.");
    });
});
