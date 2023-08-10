import { assert } from "chai"
import { generateDissolutionGetResponse, generateGetDirector } from "../../fixtures/dissolutionApi.fixtures"
import { generateDissolutionSession } from "../../fixtures/session.fixtures"

import ViewApplicationStatusMapper from "app/mappers/view-application-status/viewApplicationStatus.mapper"
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import { ViewApplicationStatus } from "app/models/view/viewApplicationStatus.model"

describe("ViewApplicationStatusMapper", () => {

    const mapper: ViewApplicationStatusMapper = new ViewApplicationStatusMapper()

    describe("mapToViewModel", () => {
        let dissolution: DissolutionGetResponse
        let dissolutionSession: DissolutionSession

        beforeEach(() => dissolution = generateDissolutionGetResponse())
        beforeEach(() => dissolutionSession = generateDissolutionSession("123456"))

        it("should not show the change column if user is not the applicant", () => {
            const result: ViewApplicationStatus = mapper.mapToViewModel(dissolutionSession, dissolution, false)

            assert.isFalse(result.showChangeColumn)
        })

        it("should show the change column if user is the applicant", () => {
            const result: ViewApplicationStatus = mapper.mapToViewModel(dissolutionSession, dissolution, true)

            assert.isTrue(result.showChangeColumn)
        })

        it("should map each director to a signatory", () => {
            dissolution.directors = [
                generateGetDirector(),
                generateGetDirector()
            ]

            const result: ViewApplicationStatus = mapper.mapToViewModel(dissolutionSession, dissolution, true)

            assert.equal(result.signatories.length, 2)
        })

        it("should map the director officer id and email to the signatory", () => {
            dissolution.directors = [
                { ...generateGetDirector(), officer_id: "abc123", email: "test@mail.com" }
            ]

            const result: ViewApplicationStatus = mapper.mapToViewModel(dissolutionSession, dissolution, true)

            assert.equal(result.signatories[0].id, "abc123")
            assert.equal(result.signatories[0].email, "test@mail.com")
        })

        it("should set the signatory display name correctly when director is signing themselves", () => {
            dissolution.directors = [
                { ...generateGetDirector(), name: "Jane Smith", on_behalf_name: undefined }
            ]

            const result: ViewApplicationStatus = mapper.mapToViewModel(dissolutionSession, dissolution, true)

            assert.equal(result.signatories[0].name, "Jane Smith")
        })

        it("should set the signatory display name correctly when someone is signing on behalf of the director", () => {
            dissolution.directors = [
                { ...generateGetDirector(), name: "Jane Smith", on_behalf_name: "Mr Accountant" }
            ]

            const result: ViewApplicationStatus = mapper.mapToViewModel(dissolutionSession, dissolution, true)

            assert.equal(result.signatories[0].name, "Mr Accountant signing on behalf of Jane Smith")
        })

        it("should set the hasApproved flag to true if the signatory has already approved", () => {
            dissolution.directors = [
                { ...generateGetDirector(), approved_at: new Date().toISOString() }
            ]

            const result: ViewApplicationStatus = mapper.mapToViewModel(dissolutionSession, dissolution, true)

            assert.isTrue(result.signatories[0].hasApproved)
        })

        it("should set the hasApproved flag to false if the signatory has not already approved", () => {
            dissolution.directors = [
                { ...generateGetDirector(), approved_at: undefined }
            ]

            const result: ViewApplicationStatus = mapper.mapToViewModel(dissolutionSession, dissolution, true)

            assert.isFalse(result.signatories[0].hasApproved)
        })

        it("should map canChange to true if user is the applicant and signatory has not signed", () => {
            dissolution.directors = [
                { ...generateGetDirector(), approved_at: undefined }
            ]

            const result: ViewApplicationStatus = mapper.mapToViewModel(dissolutionSession, dissolution, true)

            assert.isTrue(result.signatories[0].canChange)
        })

        it("should map canChange to false if signatory has already signed", () => {
            dissolution.directors = [
                { ...generateGetDirector(), approved_at: new Date().toISOString() }
            ]

            const result: ViewApplicationStatus = mapper.mapToViewModel(dissolutionSession, dissolution, true)

            assert.isFalse(result.signatories[0].canChange)
        })

        it("should map canChange to false if user is not the applicant", () => {
            dissolution.directors = [
                { ...generateGetDirector(), approved_at: undefined }
            ]

            const result: ViewApplicationStatus = mapper.mapToViewModel(dissolutionSession, dissolution, false)

            assert.isFalse(result.signatories[0].canChange)
        })
    })
})
