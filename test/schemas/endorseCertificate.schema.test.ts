import { ValidationResult } from "@hapi/joi"
import { assert } from "chai"

import EndorseCertificateFormModel from "app/models/form/endorseCertificateFormModel"
import formSchema from "app/schemas/endorseCertificate.schema"

describe("Endorse Certificate Schema", () => {

    it("should return no errors when data is valid", () => {
        const validForm: EndorseCertificateFormModel = {
            confirmation: "understdood",
            _csrf: "abc123"
        }
        const errors: ValidationResult = formSchema.validate(validForm)
        assert.isUndefined(errors.error)
    })

    it("should return errors when data has missing properties", () => {
        const validForm: EndorseCertificateFormModel = {
        }

        const errors: ValidationResult = formSchema.validate(validForm)

        assert.deepEqual(errors.value, {})
        assert.equal(errors.error!.details.length, 1)
        assert.equal(errors.error!.details[0].context!.key, "confirmation")
    })
})
