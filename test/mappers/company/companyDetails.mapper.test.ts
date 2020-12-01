import { CompanyProfile } from '@companieshouse/api-sdk-node/dist/services/company-profile/types'
import { assert } from 'chai'
import { generateCompanyProfile} from '../../fixtures/companyProfile.fixtures'

import CompanyDetailsMapper from 'app/mappers/company/companyDetails.mapper'
import CompanyDetails from 'app/models/companyDetails.model'
import ClosableCompanyType from 'app/models/mapper/closableCompanyType.enum'

describe('CompanyDetailsMapper', () => {

  const mapper: CompanyDetailsMapper = new CompanyDetailsMapper()

  describe('mapToCompanyDetails', () => {
    it('should extract the proper profile details of a closable ltd company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'active'
      profile.type = ClosableCompanyType.LTD

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'active')
      assert.equal(result.companyType, ClosableCompanyType.LTD)
    })

    it('should extract the proper profile details of a non-closable ltd company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'inactive'
      profile.type = ClosableCompanyType.LTD

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'inactive')
      assert.equal(result.companyType, ClosableCompanyType.LTD)
    })

    it('should extract the proper profile details of a closable plc company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'active'
      profile.type = ClosableCompanyType.PLC

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'active')
      assert.equal(result.companyType, ClosableCompanyType.PLC)
    })

    it('should extract the proper profile details of a non-closable plc company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'inactive'
      profile.type = ClosableCompanyType.PLC

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'inactive')
      assert.equal(result.companyType, ClosableCompanyType.PLC)
    })

    it('should extract the proper profile details of a closable llp company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'active'
      profile.type = ClosableCompanyType.LLP

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'active')
      assert.equal(result.companyType, ClosableCompanyType.LLP)
    })

    it('should extract the proper profile details of a non-closable llp company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'inactive'
      profile.type = ClosableCompanyType.LLP

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'inactive')
      assert.equal(result.companyType, ClosableCompanyType.LLP)
    })

    it('should extract the proper profile details of a closable "private-unlimited" company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'active'
      profile.type = ClosableCompanyType.PRIVATE_UNLIMITED

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'active')
      assert.equal(result.companyType, ClosableCompanyType.PRIVATE_UNLIMITED)
    })

    it('should extract the proper profile details of a closable "old-public-company" company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'active'
      profile.type = ClosableCompanyType.OLD_PUBLIC_COMPANY

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'active')
      assert.equal(result.companyType, ClosableCompanyType.OLD_PUBLIC_COMPANY)
    })

    it('should extract the proper profile details of a closable "private-limited-guarant-nsc-limited-exemption" company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'active'
      profile.type = ClosableCompanyType.PRIVATE_LIMITED_GUARANT_NSC_LIMITED_EXEMPTION

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'active')
      assert.equal(result.companyType, ClosableCompanyType.PRIVATE_LIMITED_GUARANT_NSC_LIMITED_EXEMPTION)
    })

    it('should extract the proper profile details of a closable "private-limited-guarant-nsc" company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'active'
      profile.type = ClosableCompanyType.PRIVATE_LIMITED_GUARANT_NSC

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'active')
      assert.equal(result.companyType, ClosableCompanyType.PRIVATE_LIMITED_GUARANT_NSC)
    })

    it('should extract the proper profile details of a closable "private-unlimited-nsc" company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'active'
      profile.type = ClosableCompanyType.PRIVATE_UNLIMITED_NSC

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'active')
      assert.equal(result.companyType, ClosableCompanyType.PRIVATE_UNLIMITED_NSC)
    })

    it('should extract the proper profile details of a closable "private-limited-shares-section-30-exemption" company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'active'
      profile.type = ClosableCompanyType.PRIVATE_LIMITED_SHARES_SECTION_30_EXEMPTION

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'active')
      assert.equal(result.companyType, ClosableCompanyType.PRIVATE_LIMITED_SHARES_SECTION_30_EXEMPTION)
    })

    it('should extract the proper profile details of a closable "northern-ireland" company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'active'
      profile.type = ClosableCompanyType.NORTHERN_IRELAND

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'active')
      assert.equal(result.companyType, ClosableCompanyType.NORTHERN_IRELAND)
    })

    it('should extract the proper profile details of a closable "northern-ireland-other" company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'active'
      profile.type = ClosableCompanyType.NORTHERN_IRELAND_OTHER

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'active')
      assert.equal(result.companyType, ClosableCompanyType.NORTHERN_IRELAND_OTHER)
    })

    it('should extract the proper profile details of a active but non-closable company type', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = '01777777'
      profile.companyStatus = 'active'
      profile.type = 'non-closable-company-type'

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, '01777777')
      assert.equal(result.companyStatus, 'active')
      assert.equal(result.companyType, 'non-closable-company-type')
    })

    it('should extract the proper profile details of a active but non-closable overseas company', () => {
      const profile: CompanyProfile = generateCompanyProfile()

      profile.companyName = 'this company'
      profile.companyNumber = 'SF777777'
      profile.companyStatus = 'active'
      profile.type = ClosableCompanyType.LLP

      const result: CompanyDetails = mapper.mapToCompanyDetails(profile)

      assert.equal(result.companyName, 'this company')
      assert.equal(result.companyNumber, 'SF777777')
      assert.equal(result.companyStatus, 'active')
      assert.equal(result.companyType, ClosableCompanyType.LLP)
    })
  })
})
