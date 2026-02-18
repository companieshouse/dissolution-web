import { assert } from "chai"

import { DefineSignatoryInfoFormModel } from "app/models/form/defineSignatoryInfo.model"
import { DirectorToSign } from "app/models/session/directorToSign.model"
import SignatoryService from "app/services/signatories/signatory.service"
import { aDefineSignatoryInfoForm } from "test/fixtures/defineSignatoryInfoForm.builder"
import { aDirectorToSign } from "test/fixtures/directorToSign.builder"
import OfficerRole from "app/models/dto/officerRole.enum"

describe("SignatoryService", () => {

    const service: SignatoryService = new SignatoryService()

    describe("getMinimumNumberOfSignatories", () => {
        it(`should calculate the majority of signatories to select if the applicant is a director and there is an even number of total
      directors`, () => {
            const result: number = service.getMinimumNumberOfSignatories(5, "123")

            assert.equal(result, 3)
        })

        it(`should calculate the majority of signatories to select if the applicant is not a director and there is an even number of total
      directors`, () => {
            const result: number = service.getMinimumNumberOfSignatories(6, "other")

            assert.equal(result, 4)
        })

        it(`should calculate the majority of signatories to select if the applicant is a director and there is an odd number of total
      directors`, () => {
            const result: number = service.getMinimumNumberOfSignatories(4, "123")

            assert.equal(result, 2)
        })

        it(`should calculate the majority of signatories to select if the applicant is not a director and there is an odd number of total
      directors`, () => {
            const result: number = service.getMinimumNumberOfSignatories(5, "other")

            assert.equal(result, 3)
        })

        it(`should ensure that all signatories must be selected if company only has 2 directors and applicant is not a director`, () => {
            const result: number = service.getMinimumNumberOfSignatories(2, "other")

            assert.equal(result, 2)
        })

        it(`should ensure that all signatories must be selected if company only has 2 directors and applicant is a director`, () => {
            const result: number = service.getMinimumNumberOfSignatories(1, "other")

            assert.equal(result, 1)
        })
    })

    describe("updateSignatoriesWithContactInfo", () => {
        const SIGNATORY_1_ID = "123"
        const SIGNATORY_2_ID = "456"

        const SIGNATORY_1_ID_LOWER = SIGNATORY_1_ID.toLowerCase()
        const SIGNATORY_2_ID_LOWER = SIGNATORY_2_ID.toLowerCase()

        it("should update signatories with their contact info for a standard officer", () => {
            const contactForm: DefineSignatoryInfoFormModel = aDefineSignatoryInfoForm()
                .withDirectorEmail(SIGNATORY_1_ID_LOWER, "director@mail.com")
                .withDirectorEmail(SIGNATORY_2_ID_LOWER, "otherdirector@mail.com").build()

            const signatory1: DirectorToSign = aDirectorToSign().withId(SIGNATORY_1_ID_LOWER).withName("Mr Standard Director 1").build()
            const signatory2: DirectorToSign = aDirectorToSign().withId(SIGNATORY_2_ID_LOWER).withName("Mr Standard Director 2").build()

            const updated = service.updateSignatoriesWithContactInfo([signatory1, signatory2], contactForm)

            assert.equal(updated[0].email, "director@mail.com")
            assert.isUndefined(updated[0].onBehalfName)

            assert.equal(updated[1].email, "otherdirector@mail.com")
            assert.isUndefined(updated[1].onBehalfName)
        })

        it("should update signatories with their contact info for corporate officer", () => {
            const contactForm: DefineSignatoryInfoFormModel = aDefineSignatoryInfoForm()
                .withOnBehalfName(SIGNATORY_1_ID_LOWER, "Mr Accountant")
                .withOnBehalfEmail(SIGNATORY_1_ID_LOWER, "accountant@mail.com")
                .withOnBehalfName(SIGNATORY_2_ID_LOWER, "Miss Solicitor")
                .withOnBehalfEmail(SIGNATORY_2_ID_LOWER, "solicitor@mail.com").build()

            const signatory1: DirectorToSign = aDirectorToSign().withId(SIGNATORY_1_ID_LOWER).withName("Corporate Director 1").withOfficerRole(OfficerRole.CORPORATE_DIRECTOR).build()
            const signatory2: DirectorToSign = aDirectorToSign().withId(SIGNATORY_2_ID_LOWER).withName("Corporate Director 2").withOfficerRole(OfficerRole.CORPORATE_NOMINEE_DIRECTOR).build()

            const updated = service.updateSignatoriesWithContactInfo([signatory1, signatory2], contactForm)

            assert.equal(updated[0].email, "accountant@mail.com")
            assert.equal(updated[0].onBehalfName, "Mr Accountant")

            assert.equal(updated[1].email, "solicitor@mail.com")
            assert.equal(updated[1].onBehalfName, "Miss Solicitor")
        })

        it("should handle multiple signatories selecting different options for signing preference", () => {
            const contactForm: DefineSignatoryInfoFormModel = aDefineSignatoryInfoForm()
                .withDirectorEmail(SIGNATORY_1_ID_LOWER, "director@mail.com")
                .withOnBehalfName(SIGNATORY_2_ID_LOWER, "Mr Accountant")
                .withOnBehalfEmail(SIGNATORY_2_ID_LOWER, "accountant@mail.com").build()

            const signatory1: DirectorToSign = aDirectorToSign().withId(SIGNATORY_1_ID_LOWER).withName("Standard Director").withOfficerRole(OfficerRole.DIRECTOR).build()
            const signatory2: DirectorToSign = aDirectorToSign().withId(SIGNATORY_2_ID_LOWER).withName("Corporate Director").withOfficerRole(OfficerRole.CORPORATE_DIRECTOR).build()

            const updated = service.updateSignatoriesWithContactInfo([signatory1, signatory2], contactForm)

            assert.equal(updated[0].email, "director@mail.com")
            assert.isUndefined(updated[0].onBehalfName)

            assert.equal(updated[1].email, "accountant@mail.com")
            assert.equal(updated[1].onBehalfName, "Mr Accountant")
        })
    })
})
