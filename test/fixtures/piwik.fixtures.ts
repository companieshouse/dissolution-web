import PiwikConfig from 'app/models/piwikConfig'

export function generatePiwikConfig(): PiwikConfig {
  return  {
    url: '',
    siteId: '',
    landingPageStartGoalId: 999,
    confirmationPagePDFGoalId: 998,
    limitedCompanyGoalId: 997,
    partnershipGoalId: 996,
    limitedCompanyConfirmationGoalId: 1000,
    partnershipConfirmationGoalId: 1001,
    multiDirectorConfirmationGoalId: 1002,
    singleDirectorConfirmationGoalId: 1003
  }
}
