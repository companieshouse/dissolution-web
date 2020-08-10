import { assert } from 'chai'
import 'mocha'
import { generateDissolutionGetResponse, generateGetDirector } from '../../fixtures/dissolutionApi.fixtures'

import DissolutionApprovalMapper from 'app/mappers/approval/dissolutionApproval.mapper'
import ApplicationType from 'app/models/dto/applicationType.enum'
import DissolutionGetDirector from 'app/models/dto/dissolutionGetDirector'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import OfficerType from 'app/models/dto/officerType.enum'
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

    it('should map the company information to the approval model for DS01', () => {
      dissolution.company_name = 'some company name'
      dissolution.company_number = '12345'
      dissolution.application_type = ApplicationType.DS01

      const result: DissolutionApprovalModel = mapper.mapToApprovalModel(dissolution, signatory)

      assert.equal(result.companyName, 'some company name')
      assert.equal(result.companyNumber, '12345')
      assert.equal(result.officerType, OfficerType.DIRECTOR)
    })

    it('should map the company information to the approval model for LLDS01', () => {
      dissolution.company_name = 'some company name'
      dissolution.company_number = '12345'
      dissolution.application_type = ApplicationType.LLDS01

      const result: DissolutionApprovalModel = mapper.mapToApprovalModel(dissolution, signatory)

      assert.equal(result.companyName, 'some company name')
      assert.equal(result.companyNumber, '12345')
      assert.equal(result.officerType, OfficerType.MEMBER)
    })

    it('should map the signatory information to the approval model', () => {
      signatory.name = 'some signatory name'

      const result: DissolutionApprovalModel = mapper.mapToApprovalModel(dissolution, signatory)

      assert.equal(result.applicant, 'some signatory name')
    })
  })
})