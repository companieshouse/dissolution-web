import { assert } from 'chai'
import { generatePiwikConfig } from '../fixtures/piwik.fixtures'

import { asDirectorSingleMultiConfirmationGoalId } from 'app/filters/asDirectorSingleMultiConfirmationGoalId.filter'
import PiwikConfig from 'app/models/piwikConfig'

const piwikConfig: PiwikConfig = generatePiwikConfig()

describe('asDirectorSingleMultiConfirmationGoalId', () => {
  it(`should return 'multiDirectorConfirmationGoalId' when isMultiDirector is true`, () => {
    assert.equal(piwikConfig.multiDirectorConfirmationGoalId, asDirectorSingleMultiConfirmationGoalId(true, piwikConfig))
  })

  it(`should return 'limitedCompanyGoalId' when isMultiDirector is false`, () => {
    assert.equal(piwikConfig.singleDirectorConfirmationGoalId, asDirectorSingleMultiConfirmationGoalId(false, piwikConfig))
  })
})
