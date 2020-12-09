import ApplicationType from 'app/models/dto/applicationType.enum'
import PiwikConfig from 'app/models/piwikConfig'

export function asApplicationTypeConfirmationGoalId(applicationType: string, piwikConfig: PiwikConfig): number {
  return applicationType === ApplicationType.LLDS01 ?
    piwikConfig.partnershipConfirmationGoalId : piwikConfig.limitedCompanyConfirmationGoalId
}
