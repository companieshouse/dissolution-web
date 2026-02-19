import OfficerRole from "app/models/dto/officerRole.enum"

export interface DirectorToSign {
  id: string
  name: string
  isApplicant: boolean
  officerRole: OfficerRole
  email?: string
  onBehalfName?: string
}

export interface DirectorToRemind {
  id: string
  reminderSent?: boolean
}
