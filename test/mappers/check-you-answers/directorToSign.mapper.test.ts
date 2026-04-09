import { assert } from "chai"
import { generateDirectorDetails } from "../../fixtures/companyOfficers.fixtures"

import DirectorToSignMapper from "app/mappers/check-your-answers/directorToSign.mapper"
import { DirectorToSign } from "app/models/session/directorToSign.model"
import DirectorDetails from "app/models/view/directorDetails.model"
import SelectedDirectorDetails from "app/models/view/selectedDirectorDetails.model";
import {aSelectedDirectorDetails} from "test/fixtures/selectedDirectorDetails.builder";

describe("DirectorToSignMapper", () => {

    const mapper: DirectorToSignMapper = new DirectorToSignMapper()

    const ID = "123"
    const NAME = "Geoff Smith"
    const EMAIL = "test@mail.com"

    describe("mapAsApplicant", () => {
        it("should map standard values", () => {
            const director: SelectedDirectorDetails = aSelectedDirectorDetails().withId(ID).withName(NAME).build()

            const result: DirectorToSign = mapper.mapAsApplicant(director, EMAIL)

            assert.equal(result.id, ID)
            assert.equal(result.name, NAME)
            assert.equal(result.email, EMAIL)
            assert.isTrue(result.isApplicant)
            assert.isUndefined(result.onBehalfName)
        })

        it("should map onBehalfName if provided", () => {
            const director: SelectedDirectorDetails = aSelectedDirectorDetails().withId(ID).withName(NAME).withOnBehalfName("Guido").build()

            const result: DirectorToSign = mapper.mapAsApplicant(director, EMAIL)

            assert.equal(result.id, ID)
            assert.equal(result.name, NAME)
            assert.equal(result.email, EMAIL)
            assert.isTrue(result.isApplicant)
            assert.equal(result.onBehalfName, "Guido")
        })
    })

    describe("mapAsSignatory", () => {
        it("should map id and name", () => {
            const director: DirectorDetails = generateDirectorDetails()
            director.id = ID
            director.name = NAME

            const result: DirectorToSign = mapper.mapAsSignatory(director)

            assert.equal(result.id, ID)
            assert.equal(result.name, NAME)
        })

        it("should not mark the director as the applicant", () => {
            const director: DirectorDetails = generateDirectorDetails()

            const result: DirectorToSign = mapper.mapAsSignatory(director)

            assert.isFalse(result.isApplicant)
        })
    })
})
