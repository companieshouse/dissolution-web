import ClosableCompanyType from 'app/models/mapper/closableCompanyType.enum'

export function asCompanyTypeGoalsId(companyType: string): string {
  if (companyType === ClosableCompanyType.LLP) {
    return 'partnershipGoalId'
  }
  else {
    return 'limitedCompanyGoalId'
  }
}
