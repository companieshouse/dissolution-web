import { ValidationResult } from "@hapi/joi"
import { assert } from "chai"
import { DefineSignatoryInfoFormModel } from "app/models/form/defineSignatoryInfo.model"
import { DirectorToSign } from "app/models/session/directorToSign.model"
import defineSignatoryInfoSchema from "app/schemas/defineSignatoryInfo.schema"
import { aDefineSignatoryInfoForm } from "test/fixtures/defineSignatoryInfoForm.builder"
import { aDirectorToSign } from "test/fixtures/directorToSign.builder"
import OfficerRole from "app/models/dto/officerRole.enum"

describe("Define Signatory Info Schema", () => {

    const SIGNATORY_1_ID = "123AbC"
    const SIGNATORY_2_ID = "456dEf"

    const SIGNATORY_1_ID_LOWER = SIGNATORY_1_ID.toLowerCase()
    const SIGNATORY_2_ID_LOWER = SIGNATORY_2_ID.toLowerCase()

    it("should return no errors when data is valid", () => {

        const signatory1: DirectorToSign = aDirectorToSign().withId(SIGNATORY_1_ID).withName("Standard Signatory").withOfficerRole(OfficerRole.DIRECTOR).build()
        const signatory2: DirectorToSign = aDirectorToSign().withId(SIGNATORY_2_ID).withName("Corporate Signatory").withOfficerRole(OfficerRole.CORPORATE_DIRECTOR).build()

        const form: DefineSignatoryInfoFormModel = aDefineSignatoryInfoForm()
            .withDirectorEmail(SIGNATORY_1_ID_LOWER, "director@mail.com")
            .withOnBehalfName(SIGNATORY_2_ID_LOWER, "Mr Accountant")
            .withOnBehalfEmail(SIGNATORY_2_ID_LOWER, "accountant@mail.com")
            .build()

        const errors: ValidationResult = defineSignatoryInfoSchema([signatory1, signatory2]).validate(form, { abortEarly: false })

        assert.isUndefined(errors.error)
    })

    it("should return an error if mandatory text fields have not been provided", () => {

        const signatory1: DirectorToSign = aDirectorToSign().withId(SIGNATORY_1_ID).withName("Mr Standard Director Signatory").withOfficerRole(OfficerRole.DIRECTOR).build()
        const signatory2: DirectorToSign = aDirectorToSign().withId(SIGNATORY_2_ID).withName("Mr Corporate Signatory").withOfficerRole(OfficerRole.CORPORATE_DIRECTOR).build()

        const form: DefineSignatoryInfoFormModel = aDefineSignatoryInfoForm()
            .withDirectorEmail(SIGNATORY_1_ID_LOWER, "")
            .withOnBehalfName(SIGNATORY_2_ID_LOWER, "")
            .withOnBehalfEmail(SIGNATORY_2_ID_LOWER, "")
            .build()

        const errors: ValidationResult = defineSignatoryInfoSchema([signatory1, signatory2]).validate(form, { abortEarly: false })

        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 3)

        assert.equal(errors.error!.details[0].context!.key, `directorEmail_${SIGNATORY_1_ID_LOWER}`)
        assert.equal(errors.error!.details[0].type, `string.empty`)
        assert.equal(errors.error!.details[0].message, `Enter the email address for Mr Standard Director Signatory`)

        assert.equal(errors.error!.details[1].context!.key, `onBehalfName_${SIGNATORY_2_ID_LOWER}`)
        assert.equal(errors.error!.details[1].type, `string.empty`)
        assert.equal(errors.error!.details[1].message, `Enter the name of the authorised person who will sign for Mr Corporate Signatory`)

        assert.equal(errors.error!.details[2].context!.key, `onBehalfEmail_${SIGNATORY_2_ID_LOWER}`)
        assert.equal(errors.error!.details[2].type, `string.empty`)
        assert.equal(errors.error!.details[2].message, `Enter the email address for the authorised person who will sign for Mr Corporate Signatory`)
    })

    it("should return an error if email fields do not contain valid email values", () => {
        const signatory1: DirectorToSign = aDirectorToSign().withId(SIGNATORY_1_ID).withName("Mr Standard Director Signatory").withOfficerRole(OfficerRole.DIRECTOR).build()
        const signatory2: DirectorToSign = aDirectorToSign().withId(SIGNATORY_2_ID).withName("Mr Corporate Signatory").withOfficerRole(OfficerRole.CORPORATE_DIRECTOR).build()

        const form: DefineSignatoryInfoFormModel = aDefineSignatoryInfoForm()
            .withDirectorEmail(SIGNATORY_1_ID_LOWER, "not an email")
            .withOnBehalfName(SIGNATORY_2_ID_LOWER, "Mr Accountant")
            .withOnBehalfEmail(SIGNATORY_2_ID_LOWER, "also not an email")
            .build()

        const errors: ValidationResult = defineSignatoryInfoSchema([signatory1, signatory2]).validate(form, { abortEarly: false })

        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 2)

        assert.equal(errors.error!.details[0].context!.key, `directorEmail_${SIGNATORY_1_ID_LOWER}`)
        assert.equal(errors.error!.details[0].type, `string.email`)
        assert.equal(errors.error!.details[0].message, `Enter an email address in the correct format, like name@example.com`)

        assert.equal(errors.error!.details[1].context!.key, `onBehalfEmail_${SIGNATORY_2_ID_LOWER}`)
        assert.equal(errors.error!.details[1].type, `string.email`)
        assert.equal(errors.error!.details[1].message, `Enter an email address in the correct format, like name@example.com`)
    })

    it("should return an error if a name is provided that is above the maximum length", () => {

        const signatory1: DirectorToSign = aDirectorToSign().withId(SIGNATORY_1_ID).withName("Mr Standard Director Signatory").withOfficerRole(OfficerRole.DIRECTOR).build()
        const signatory2: DirectorToSign = aDirectorToSign().withId(SIGNATORY_2_ID).withName("Mr Corporate Signatory").withOfficerRole(OfficerRole.CORPORATE_DIRECTOR).build()

        const form: DefineSignatoryInfoFormModel = aDefineSignatoryInfoForm()
            .withDirectorEmail(SIGNATORY_1_ID_LOWER, "director@mail.com")
            .withOnBehalfName(SIGNATORY_2_ID_LOWER, "X".repeat(251))
            .withOnBehalfEmail(SIGNATORY_2_ID_LOWER, "accountant@mail.com")
            .build()

        const errors: ValidationResult = defineSignatoryInfoSchema([signatory1, signatory2]).validate(form, { abortEarly: false })

        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 1)

        assert.equal(errors.error!.details[0].context!.key, `onBehalfName_${SIGNATORY_2_ID_LOWER}`)
        assert.equal(errors.error!.details[0].type, `string.max`)
        assert.equal(errors.error!.details[0].message, `Name of authorised person signing for Mr Corporate Signatory must be 250 characters or less`)
    })
})
