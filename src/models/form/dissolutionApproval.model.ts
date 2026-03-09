import OfficerType from "app/models/dto/officerType.enum"

export default interface DissolutionApprovalModel {
  officerId: string
  companyName: string
  companyNumber: string
  applicant: string
  officerType: OfficerType // Officer type: 'director' for company directors, 'member' for LLP members
  isCorporateOfficer?: boolean // Flag to indicate if the officer is a corporate officer
  onBehalfName?: string
  date: string
  _csrf?: string
}
