import { CompanyProfile } from 'ch-sdk-node/dist/services/company-profile/types'
import { assert } from 'chai'
import { generateCompanyProfile} from '../../fixtures/companyProfile.fixtures'

import CompanyDetailsMapper from 'app/mappers/company/companyDetails.mapper'
import CompanyDetails from 'app/models/companyDetails.model'

describe('CompanyDetailsMapper', () => {

  const mapper: CompanyDetailsMapper = new CompanyDetailsMapper()

  describe('mapToCompanyDetails', () => {
    it('should extract the proper profile details of a closable ltd company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'active'
      profile.type = 'ltd'

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'active')
      assert.equal(result.companyType, 'ltd')
      assert.equal(result.canClose, true)
    })

    it('should extract the proper profile details of a non-closable ltd company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'inactive'
      profile.type = 'ltd'

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'inactive')
      assert.equal(result.companyType, 'ltd')
      assert.equal(result.canClose, false)
    })

    it('should extract the proper profile details of a closable plc company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'active'
      profile.type = 'plc'

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'active')
      assert.equal(result.companyType, 'plc')
      assert.equal(result.canClose, true)
    })

    it('should extract the proper profile details of a non-closable plc company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'inactive'
      profile.type = 'plc'

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'inactive')
      assert.equal(result.companyType, 'plc')
      assert.equal(result.canClose, false)
    })

    it('should extract the proper profile details of a active but non-closable company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'active'
      profile.type = 'llp'

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'active')
      assert.equal(result.companyType, 'llp')
      assert.equal(result.canClose, false)
    })
  })
})