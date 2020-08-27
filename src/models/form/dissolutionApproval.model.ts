import OfficerType from 'app/models/dto/officerType.enum'

export default interface DissolutionApprovalModel {
  officerId: string
  companyName: string
  companyNumber: string
  applicant: string
  officerType: OfficerType
  onBehalfName?: string
  date: string
}
