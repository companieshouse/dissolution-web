export interface DirectorToSign {
  id: string
  name: string
  isApplicant: boolean
  officerRole: string
  email?: string
  onBehalfName?: string
}

export interface DirectorToRemind {
  id: string
  reminderSent?: boolean
}
