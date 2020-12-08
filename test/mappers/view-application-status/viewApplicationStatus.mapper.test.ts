import { assert } from 'chai'
import { generateDissolutionGetResponse, generateGetDirector } from '../../fixtures/dissolutionApi.fixtures'

import ViewApplicationStatusMapper from 'app/mappers/view-application-status/viewApplicationStatus.mapper'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import { ViewApplicationStatus } from 'app/models/view/viewApplicationStatus.model'

describe('ViewApplicationStatusMapper', () => {

  const mapper: ViewApplicationStatusMapper = new ViewApplicationStatusMapper()

  describe('mapToViewModel', () => {
    let dissolution: DissolutionGetResponse

    beforeEach(() => dissolution = generateDissolutionGetResponse())

    it('should map each director to a signatory', () => {
      dissolution.directors = [
        generateGetDirector(),
        generateGetDirector()
      ]

      const result: ViewApplicationStatus = mapper.mapToViewModel(dissolution)

      assert.equal(result.signatories.length, 2)
    })

    it('should map the director officer id and email to the signatory', () => {
      dissolution.directors = [
        { ...generateGetDirector(), officer_id: 'abc123', email: 'test@mail.com' }
      ]

      const result: ViewApplicationStatus = mapper.mapToViewModel(dissolution)

      assert.equal(result.signatories[0].id, 'abc123')
      assert.equal(result.signatories[0].email, 'test@mail.com')
    })

    it('should set the signatory display name correctly when director is signing themselves', () => {
      dissolution.directors = [
        { ...generateGetDirector(), name: 'Jane Smith', on_behalf_name: undefined }
      ]

      const result: ViewApplicationStatus = mapper.mapToViewModel(dissolution)

      assert.equal(result.signatories[0].name, 'Jane Smith')
    })

    it('should set the signatory display name correctly when someone is signing on behalf of the director', () => {
      dissolution.directors = [
        { ...generateGetDirector(), name: 'Jane Smith', on_behalf_name: 'Mr Accountant' }
      ]

      const result: ViewApplicationStatus = mapper.mapToViewModel(dissolution)

      assert.equal(result.signatories[0].name, 'Mr Accountant signing on behalf of Jane Smith')
    })

    it('should set the hasApproved flag to true if the signatory has already approved', () => {
      dissolution.directors = [
        { ...generateGetDirector(), approved_at: new Date().toISOString() }
      ]

      const result: ViewApplicationStatus = mapper.mapToViewModel(dissolution)

      assert.isTrue(result.signatories[0].hasApproved)
    })

    it('should set the hasApproved flag to false if the signatory has not already approved', () => {
      dissolution.directors = [
        { ...generateGetDirector(), approved_at: undefined }
      ]

      const result: ViewApplicationStatus = mapper.mapToViewModel(dissolution)

      assert.isFalse(result.signatories[0].hasApproved)
    })
  })
})
