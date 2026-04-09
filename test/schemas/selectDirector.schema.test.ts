import {ValidationResult} from "@hapi/joi"
import {assert} from "chai"
import {aSelectDirectorFormModel} from "../fixtures/selectDirectorForm.builder"
import {aDirectorDetails} from "../fixtures/directorDetails.builder"

import OfficerType from "app/models/dto/officerType.enum"
import SelectDirectorFormModel from "app/models/form/selectDirector.model"
import selectDirectorSchema from "app/schemas/selectDirector.schema"
import OfficerRole from "app/models/dto/officerRole.enum"

describe("Select Director Schema", () => {

    const validCases = [
        {
            desc: "standard director selected",
            form: aSelectDirectorFormModel().withDirector("123").build()
        },
        {
            desc: "corporate director selected with onBehalfName",
            form: aSelectDirectorFormModel().withDirector("456").withOnBehalfName("456", "Authorised Person").build()
        }
    ]

    validCases.forEach(c => {
        it(`should return no errors when data is valid - ${c.desc}`, () => {
            const directorDetails = [
                aDirectorDetails().withId("123").build(),
                aDirectorDetails().withId("456").withOfficerRole(OfficerRole.CORPORATE_DIRECTOR).withName("CorpCo").build()
            ]

            const errors: ValidationResult = selectDirectorSchema(OfficerType.DIRECTOR, directorDetails).validate(c.form)
            assert.isUndefined(errors.error)
        })
    })

    const officerTypes = [
        {
            officerType: OfficerType.DIRECTOR
        },
        {
            officerType: OfficerType.MEMBER
        }
    ]

    officerTypes.forEach(t => {
        it(`should return an error when no ${t.officerType} is specified`, () => {

            const directorDetails = [
                aDirectorDetails().withId("123").build(),
                aDirectorDetails().withId("456").withOfficerRole(OfficerRole.CORPORATE_DIRECTOR).build()
            ]

            const form: SelectDirectorFormModel = aSelectDirectorFormModel().withDirector(undefined).build()

            const result: ValidationResult = selectDirectorSchema(t.officerType, directorDetails).validate(form)

            assert.isDefined(result.error)
            assert.equal(result.error!.details.length, 1)
            assert.equal(result.error!.details[0].context!.key, "director")
            assert.equal(result.error!.details[0].type, "any.required")
            assert.equal(
                result.error!.details[0].message,
                `Select which of the ${t.officerType}s you are or if you're not a ${t.officerType}`
            )
        })
    })

    officerTypes.forEach(t => {
        it(`should return an error when specified ${t.officerType} is not associated to the company`, () => {

            const directorDetails = [
                aDirectorDetails().withId("123").build(),
                aDirectorDetails().withId("456").build()
            ]

            const form: SelectDirectorFormModel = aSelectDirectorFormModel().withDirector("999").build()

            const result: ValidationResult = selectDirectorSchema(t.officerType, directorDetails).validate(form)

            assert.isDefined(result.error)
            assert.equal(result.error!.details.length, 1)
            assert.equal(result.error!.details[0].context!.key, "director")
            assert.equal(result.error!.details[0].type, "any.only")
            assert.equal(result.error!.details[0].message, `Invalid ${t.officerType} specified`)
        })
    })

    const invalidOnBehalfNameCases = [
        {
            scenario: "undefined name",
            form: aSelectDirectorFormModel().withDirector("abc123").withOnBehalfName("abc123", undefined).build(),
            officerType: OfficerType.DIRECTOR,
            expectedError: "Enter the name of the authorised person who will sign on behalf of the corporate director"
        },
        {
            scenario: "undefined name",
            form: aSelectDirectorFormModel().withDirector("abc123").withOnBehalfName("abc123", undefined).build(),
            officerType: OfficerType.MEMBER,
            expectedError: "Enter the name of the authorised person who will sign on behalf of the corporate member"
        },
        {
            scenario: "empty name",
            form: aSelectDirectorFormModel().withDirector("abc123").withOnBehalfName("abc123", "").build(),
            officerType: OfficerType.DIRECTOR,
            expectedError: "Enter the name of the authorised person who will sign on behalf of the corporate director"
        },
        {
            scenario: "empty name",
            form: aSelectDirectorFormModel().withDirector("abc123").withOnBehalfName("abc123", "").build(),
            officerType: OfficerType.MEMBER,
            expectedError: "Enter the name of the authorised person who will sign on behalf of the corporate member"
        },
        {
            scenario: "empty whitespace name",
            form: aSelectDirectorFormModel().withDirector("abc123").withOnBehalfName("abc123", "   ").build(),
            officerType: OfficerType.DIRECTOR,
            expectedError: "Enter the name of the authorised person who will sign on behalf of the corporate director"
        },
        {
            scenario: "empty whitespace name",
            form: aSelectDirectorFormModel().withDirector("abc123").withOnBehalfName("abc123", "   ").build(),
            officerType: OfficerType.MEMBER,
            expectedError: "Enter the name of the authorised person who will sign on behalf of the corporate member"
        },
        {
            scenario: "name too long",
            form: aSelectDirectorFormModel().withDirector("abc123").withOnBehalfName("abc123", "X".repeat(251)).build(),
            officerType: OfficerType.DIRECTOR,
            expectedError: "Name of authorised person signing must be 250 characters or less"
        },
        {
            scenario: "name too long",
            form: aSelectDirectorFormModel().withDirector("abc123").withOnBehalfName("abc123", "X".repeat(251)).build(),
            officerType: OfficerType.MEMBER,
            expectedError: "Name of authorised person signing must be 250 characters or less"
        },
    ]

    invalidOnBehalfNameCases.forEach(c => {
        it(`should return an error when invalid onBehalfNameName is specified for selected corporate ${c.officerType} - [${c.scenario}]`, () => {

            const directorDetails = [
                aDirectorDetails().build(),
                aDirectorDetails().withId("abc123").withName("corp").withOfficerRole(OfficerRole.CORPORATE_DIRECTOR).build()
            ]

            const result: ValidationResult = selectDirectorSchema(c.officerType, directorDetails).validate(c.form)

            assert.isDefined(result.error)
            assert.equal(result.error!.details.length, 1)
            assert.equal(result.error!.details[0].context!.key, `onBehalfName_abc123`)
            assert.equal(result.error!.details[0].message, c.expectedError)
        })
    })
})
