import { assert } from "chai"
import { generateDirectorToSign } from "../../fixtures/session.fixtures"

import CheckYourAnswersDirectorMapper from "app/mappers/check-your-answers/checkYourAnswersDirector.mapper"
import { DirectorToSign } from "app/models/session/directorToSign.model"
import CheckYourAnswersDirector from "app/models/view/checkYourAnswersDirector.model"

describe("CheckYourAnswersDirectorMapper", () => {

    const mapper: CheckYourAnswersDirectorMapper = new CheckYourAnswersDirectorMapper()

    const NAME = "Geoff Smith"
    const EMAIL = "test@mail.com"
    const ON_BEHALF_NAME = "Captain America"

    describe("mapToCheckYourAnswersDirector", () => {
        it("should map name, on behalf name and email", () => {
            const director: DirectorToSign = generateDirectorToSign()
            director.name = NAME
            director.email = EMAIL
            director.onBehalfName = ON_BEHALF_NAME

            const result: CheckYourAnswersDirector = mapper.mapToCheckYourAnswersDirector(director)

            assert.equal(result.name, NAME)
            assert.equal(result.email, EMAIL)
            assert.equal(result.onBehalfName, ON_BEHALF_NAME)
        })
    })
})
