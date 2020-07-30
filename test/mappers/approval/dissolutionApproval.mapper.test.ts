import { assert } from 'chai'
import 'mocha'
import { generateDissolutionGetResponse, generateGetDirector } from '../../fixtures/dissolutionApi.fixtures'

import DissolutionApprovalMapper from 'app/mappers/approval/dissolutionApproval.mapper'
import DissolutionGetDirector from 'app/models/dto/dissolutionGetDirector'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import DissolutionApprovalModel from 'app/models/form/dissolutionApproval.model'

describe('DissolutionApprovalMapper', () => {

  const mapper: DissolutionApprovalMapper = new DissolutionApprovalMapper()

  describe('mapToApprovalModel', () => {
    let dissolution: DissolutionGetResponse
    let signatory: DissolutionGetDirector

    beforeEach(() => {
      dissolution = generateDissolutionGetResponse()
      signatory = generateGetDirector()
    })

    it('should map the company information to the approval model', () => {
      dissolution.company_name = 'some company name'
      dissolution.company_number = '12345'

      const result: DissolutionApprovalModel = mapper.mapToApprovalModel(dissolution, signatory)

      assert.equal(result.companyName, 'some company name')
      assert.equal(result.companyNumber, '12345')
    })

    it('should map the signatory information to the approval model', () => {
      signatory.name = 'some signatory name'

      const result: DissolutionApprovalModel = mapper.mapToApprovalModel(dissolution, signatory)

      assert.equal(result.applicant, 'some signatory name')
    })
  })
})