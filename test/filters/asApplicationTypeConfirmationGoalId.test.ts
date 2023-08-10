import { assert } from "chai"
import { generatePiwikConfig } from "../fixtures/piwik.fixtures"

import { asApplicationTypeConfirmationGoalId } from "app/filters/asApplicationTypeConfirmationGoalId.filter"
import ApplicationType from "app/models/dto/applicationType.enum"
import PiwikConfig from "app/models/piwikConfig"

const piwikConfig: PiwikConfig = generatePiwikConfig()

describe("asApplicationTypeConfirmationGoalId", () => {
    it(`should return 'partnershipConfirmationGoalId' when company is of type partnership`, () => {
        assert.equal(piwikConfig.partnershipConfirmationGoalId, asApplicationTypeConfirmationGoalId(ApplicationType.LLDS01, piwikConfig))
    })

    it(`should return 'limitedCompanyConfirmationGoalId' when company is of type limited company`, () => {
        assert.equal(piwikConfig.limitedCompanyConfirmationGoalId, asApplicationTypeConfirmationGoalId(ApplicationType.DS01, piwikConfig))
    })
})
