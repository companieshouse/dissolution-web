import DissolutionService from "app/services/dissolution/dissolution.service";

export interface ViewApplicationStatus {
  dissolutionService: DissolutionService
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
