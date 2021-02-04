import DissolutionSession from "../session/dissolutionSession.model";

export interface ViewApplicationStatus {
  dissolutionSession: DissolutionSession
  showChangeColumn: boolean
  signatories: ViewApplicationStatusSignatory[]
}

export interface ViewApplicationStatusSignatory {
  id: string
  name: string
  email: string
  hasApproved: boolean
  canChange: boolean
  reminderSent: boolean
}
