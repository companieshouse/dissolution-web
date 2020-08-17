import OfficerType from 'app/models/dto/officerType.enum'

export function asCompanyDisplayName(memberType: OfficerType, capitalize?: boolean): string {
  if (memberType === OfficerType.DIRECTOR) {
    return capitalize ? 'Company' : 'company'
  }
  return 'LLP'
}