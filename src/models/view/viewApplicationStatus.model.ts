export interface ViewApplicationStatus {
  showChangeColumn: boolean
  signatories: ViewApplicationStatusSignatory[]
}

export interface ViewApplicationStatusSignatory {
  id: string
  name: string
  email: string
  hasApproved: boolean
  canChange: boolean
}
