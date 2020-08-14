import OfficerType from 'app/models/dto/officerType.enum'

export default interface DissolutionApprovalModel {
  companyName: string,
  companyNumber: string,
  applicant: string,
  officerType: OfficerType
  onBehalfName?: string,
  date: string,
  certificateBucket: string,
  certificateKey: string
}