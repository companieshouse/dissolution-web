import { ValidationResult } from "@hapi/joi"
import { assert } from "chai"

import EndorseCertificateFormModel from "app/models/form/endorseCertificateFormModel"
import formSchema from "app/schemas/endorseCertificate.schema"

describe("Endorse Certificate Schema", () => {

    it("should return no errors when data is valid", () => {
        const validForm: EndorseCertificateFormModel = {
            confirmation: "understdood",
            declaration: "declared",
            _csrf: "abc123"
        }
        const errors: ValidationResult = formSchema.validate(validForm, { abortEarly: false })
        assert.isUndefined(errors.error)
    })

    it("should return errors when data has missing properties", () => {
        const invalidForm: EndorseCertificateFormModel = {}
        const errors: ValidationResult = formSchema.validate(invalidForm, { abortEarly: false })
        assert.deepEqual(errors.value, {})
        assert.equal(errors.error!.details.length, 2)
        const keys = errors.error!.details.map(d => d.context!.key)
        assert.include(keys, "confirmation")
        assert.include(keys, "declaration")
    })

    it("should return an error if confirmation is missing", () => {
        const invalidForm: EndorseCertificateFormModel = { declaration: "declared" }
        const errors: ValidationResult = formSchema.validate(invalidForm, { abortEarly: false })
        assert.equal(errors.error!.details.length, 1)
        assert.equal(errors.error!.details[0].context!.key, "confirmation")
    })

    it("should return an error if declaration is missing", () => {
        const invalidForm: EndorseCertificateFormModel = { confirmation: "understood" }
        const errors: ValidationResult = formSchema.validate(invalidForm, { abortEarly: false })
        assert.equal(errors.error!.details.length, 1)
        assert.equal(errors.error!.details[0].context!.key, "declaration")
    })

    it("should allow optional _csrf field", () => {
        const validForm: EndorseCertificateFormModel = { confirmation: "understood", declaration: "declared" }
        const errors: ValidationResult = formSchema.validate(validForm, { abortEarly: false })
        assert.isUndefined(errors.error)
    })
    
})
