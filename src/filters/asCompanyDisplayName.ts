import OfficerType from 'app/models/dto/officerType.enum'

export function asCompanyDisplayName(memberType: OfficerType): string {
  return memberType === OfficerType.DIRECTOR ? 'company' : 'LLP'
}