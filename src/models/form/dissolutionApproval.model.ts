import OfficerType from 'app/models/dto/officerType.enum'

export default interface DissolutionApprovalModel {
  companyName: string,
  companyNumber: string,
  applicant: string,
  date: string,
  officerType: OfficerType
}