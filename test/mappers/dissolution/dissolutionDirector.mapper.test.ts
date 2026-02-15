import { assert } from "chai"
import {
    generateOnBehalfChangeDetailsFormModel,
    generateWillSignChangeDetailsFormModel
} from "../../fixtures/companyOfficers.fixtures"
import { generateGetDirector } from "../../fixtures/dissolutionApi.fixtures"

import DissolutionDirectorMapper from "app/mappers/dissolution/dissolutionDirector.mapper"
import DissolutionDirectorPatchRequest from "app/models/dto/dissolutionDirectorPatchRequest"
import DissolutionGetDirector from "app/models/dto/dissolutionGetDirector"
import ChangeDetailsFormModel from "app/models/form/changeDetails.model"

describe("DissolutionDirectorMapper", () => {

    const mapper: DissolutionDirectorMapper = new DissolutionDirectorMapper()

    describe("mapToChangeDetailsForm", () => {
        let signatory: DissolutionGetDirector

        beforeEach(() => signatory = generateGetDirector())

        it("should map to a form model if signatory is a director signing themselves", () => {
            signatory.on_behalf_name = undefined
            signatory.email = "director@mail.com"

            const result: ChangeDetailsFormModel = mapper.mapToChangeDetailsForm(signatory)

            assert.equal(result.directorEmail, "director@mail.com")
            assert.isUndefined(result.onBehalfName)
            assert.isUndefined(result.onBehalfEmail)
        })

        it("should map to a form model if signatory is signing on behalf of a director", () => {
            signatory.on_behalf_name = "Some On Behalf Name"
            signatory.email = "accountant@mail.com"

            const result: ChangeDetailsFormModel = mapper.mapToChangeDetailsForm(signatory)

            assert.equal(result.onBehalfEmail, "accountant@mail.com")
            assert.equal(result.onBehalfName, "Some On Behalf Name")
            assert.isUndefined(result.directorEmail)
        })
    })

    describe("mapToDissolutionDirectorPatchRequest", () => {
        it("should map the director name only if signatory is a director signing themselves", () => {
            const form: ChangeDetailsFormModel = generateWillSignChangeDetailsFormModel()
            form.onBehalfName = undefined
            form.directorEmail = "director@mail.com"

            const result: DissolutionDirectorPatchRequest = mapper.mapToDissolutionDirectorPatchRequest(form)

            assert.equal(result.email, "director@mail.com")
            assert.isUndefined(result.on_behalf_name)
        })

        it("should map the on behalf name and on behalf email if signatory is signing on behalf of a director", () => {
            const form: ChangeDetailsFormModel = generateOnBehalfChangeDetailsFormModel()
            form.directorEmail = "ignore@mail.com"
            form.onBehalfEmail = "accountant@mail.com"
            form.onBehalfName = "Mr Accountant"

            const result: DissolutionDirectorPatchRequest = mapper.mapToDissolutionDirectorPatchRequest(form)

            assert.equal(result.email, "accountant@mail.com")
            assert.equal(result.on_behalf_name, "Mr Accountant")
        })
    })
})
