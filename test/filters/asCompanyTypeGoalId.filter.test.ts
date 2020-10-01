import { assert } from 'chai'

import { asCompanyTypeGoalId } from 'app/filters/asCompanyTypeGoalId.filter'
import ClosableCompanyType from 'app/models/mapper/closableCompanyType.enum'
import PiwikConfig from 'app/models/piwikConfig'

const piwikConfig: PiwikConfig = {
  url: '',
  siteId: '',
  landingPageStartGoalId: 999,
  confirmationPagePDFGoalId: 998,
  limitedCompanyGoalId: 997,
  partnershipGoalId: 996
  }

describe('asCompanyTypeGoalId', () => {
  it(`should return 'partnershipGoalId' when company is of type partnership`, () => {
    assert.equal(piwikConfig.partnershipGoalId, asCompanyTypeGoalId(ClosableCompanyType.LLP, piwikConfig))
  })

  it(`should return 'limitedCompanyGoalId' when company is of type limited company`, () => {
    assert.equal(piwikConfig.limitedCompanyGoalId, asCompanyTypeGoalId(ClosableCompanyType.LTD, piwikConfig))
  })
})
