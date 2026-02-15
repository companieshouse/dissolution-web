import { ValidationResult } from "@hapi/joi"
import { assert } from "chai"
import { generateDefineSignatoryInfoFormModel } from "../fixtures/companyOfficers.fixtures"
import { generateDirectorToSign } from "../fixtures/session.fixtures"

import OfficerType from "app/models/dto/officerType.enum"
import { DefineSignatoryInfoFormModel } from "app/models/form/defineSignatoryInfo.model"
import SignatorySigning from "app/models/form/signatorySigning.enum"
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

    let signatory1: DirectorToSign
    let signatory2: DirectorToSign

    beforeEach(() => {
        signatory1 = generateDirectorToSign()
        signatory1.id = SIGNATORY_1_ID

        signatory2 = generateDirectorToSign()
        signatory2.id = SIGNATORY_2_ID
    })

    it("should return no errors when data is valid", () => {
        const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()
        const officerType: OfficerType = OfficerType.DIRECTOR

        form[`directorEmail_${SIGNATORY_1_ID_LOWER}`] = "director@mail.com"
        form[`onBehalfName_${SIGNATORY_1_ID_LOWER}`] = ""
        form[`onBehalfEmail_${SIGNATORY_1_ID_LOWER}`] = ""

        form[`directorEmail_${SIGNATORY_2_ID_LOWER}`] = ""
        form[`onBehalfName_${SIGNATORY_2_ID_LOWER}`] = "Mr Accountant"
        form[`onBehalfEmail_${SIGNATORY_2_ID_LOWER}`] = "accountant@mail.com"
        form._csrf = "abc123"

        const errors: ValidationResult = defineSignatoryInfoSchema([signatory1, signatory2], officerType).validate(form, { abortEarly: false })

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

        const officerType: OfficerType = OfficerType.DIRECTOR

        const errors: ValidationResult = defineSignatoryInfoSchema([signatory1, signatory2], officerType).validate(form, { abortEarly: false })

        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 3)

        assert.equal(errors.error!.details[0].context!.key, `directorEmail_${SIGNATORY_1_ID_LOWER}`)
        assert.equal(errors.error!.details[0].type, `string.empty`)
        assert.equal(errors.error!.details[0].message, `Enter the email address for the ${officerType}`)

        assert.equal(errors.error!.details[1].context!.key, `onBehalfName_${SIGNATORY_2_ID_LOWER}`)
        assert.equal(errors.error!.details[1].type, `string.empty`)
        assert.equal(errors.error!.details[1].message, `Enter the name for the person signing on behalf of the ${officerType}`)

        assert.equal(errors.error!.details[2].context!.key, `onBehalfEmail_${SIGNATORY_2_ID_LOWER}`)
        assert.equal(errors.error!.details[2].type, `string.empty`)
        assert.equal(errors.error!.details[2].message, `Enter the email address for the person signing on behalf of the ${officerType}`)
    })

    it("should return an error if email fields do not contain valid email values", () => {
        const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()
        const officerType: OfficerType = OfficerType.DIRECTOR

        form[`isSigning_${SIGNATORY_1_ID_LOWER}`] = SignatorySigning.WILL_SIGN
        form[`directorEmail_${SIGNATORY_1_ID_LOWER}`] = "not an email"
        form[`onBehalfName_${SIGNATORY_1_ID_LOWER}`] = ""
        form[`onBehalfEmail_${SIGNATORY_1_ID_LOWER}`] = ""

        form[`isSigning_${SIGNATORY_2_ID_LOWER}`] = SignatorySigning.ON_BEHALF
        form[`directorEmail_${SIGNATORY_2_ID_LOWER}`] = ""
        form[`onBehalfName_${SIGNATORY_2_ID_LOWER}`] = "Mr Accountant"
        form[`onBehalfEmail_${SIGNATORY_2_ID_LOWER}`] = "also not an email"

        const errors: ValidationResult = defineSignatoryInfoSchema([signatory1, signatory2], officerType).validate(form, { abortEarly: false })

        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 2)

        assert.equal(errors.error!.details[0].context!.key, `directorEmail_${SIGNATORY_1_ID_LOWER}`)
        assert.equal(errors.error!.details[0].type, `string.email`)
        assert.equal(errors.error!.details[0].message, `Enter a valid email address for the ${officerType}`)

        assert.equal(errors.error!.details[1].context!.key, `onBehalfEmail_${SIGNATORY_2_ID_LOWER}`)
        assert.equal(errors.error!.details[1].type, `string.email`)
        assert.equal(errors.error!.details[1].message, `Enter a valid email address for the person signing on behalf of the ${officerType}`)
    })

    it("should return an error if a name is provided that is above the maximum length", () => {
        const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()
        const officerType: OfficerType = OfficerType.DIRECTOR

        form[`isSigning_${SIGNATORY_1_ID_LOWER}`] = SignatorySigning.WILL_SIGN
        form[`directorEmail_${SIGNATORY_1_ID_LOWER}`] = "director@mail.com"
        form[`onBehalfName_${SIGNATORY_1_ID_LOWER}`] = ""
        form[`onBehalfEmail_${SIGNATORY_1_ID_LOWER}`] = ""

        form[`isSigning_${SIGNATORY_2_ID_LOWER}`] = SignatorySigning.ON_BEHALF
        form[`directorEmail_${SIGNATORY_2_ID_LOWER}`] = ""
        form[`onBehalfName_${SIGNATORY_2_ID_LOWER}`] = "X".repeat(251)
        form[`onBehalfEmail_${SIGNATORY_2_ID_LOWER}`] = "accountant@mail.com"

        const errors: ValidationResult = defineSignatoryInfoSchema([signatory1, signatory2], officerType).validate(form, { abortEarly: false })

        assert.isDefined(errors.error)
        assert.equal(errors.error!.details.length, 1)

        assert.equal(errors.error!.details[0].context!.key, `onBehalfName_${SIGNATORY_2_ID_LOWER}`)
        assert.equal(errors.error!.details[0].type, `string.max`)
        assert.equal(errors.error!.details[0].message, `Enter a name that is less than 250 characters for the person signing on behalf of the ${officerType}`)
    })

    it("should ignore invalid fields if the associated radio option has not been selected", () => {
        const form: DefineSignatoryInfoFormModel = generateDefineSignatoryInfoFormModel()
        const officerType: OfficerType = OfficerType.DIRECTOR

        form[`isSigning_${SIGNATORY_1_ID_LOWER}`] = SignatorySigning.WILL_SIGN
        form[`directorEmail_${SIGNATORY_1_ID_LOWER}`] = "director@mail.com"
        form[`onBehalfName_${SIGNATORY_1_ID_LOWER}`] = "X".repeat(500)
        form[`onBehalfEmail_${SIGNATORY_1_ID_LOWER}`] = "not an email"

        form[`isSigning_${SIGNATORY_2_ID_LOWER}`] = SignatorySigning.ON_BEHALF
        form[`directorEmail_${SIGNATORY_2_ID_LOWER}`] = "also not an email"
        form[`onBehalfName_${SIGNATORY_2_ID_LOWER}`] = "Mr Accountant"
        form[`onBehalfEmail_${SIGNATORY_2_ID_LOWER}`] = "accountant@mail.com"

        const errors: ValidationResult = defineSignatoryInfoSchema([signatory1, signatory2], officerType).validate(form, { abortEarly: false })

        assert.isUndefined(errors.error)
    })
})
