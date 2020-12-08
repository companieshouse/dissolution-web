export interface ViewApplicationStatus {
  signatories: ViewApplicationStatusSignatory[]
}

export interface ViewApplicationStatusSignatory {
  id: string
  name: string
  email: string
  hasApproved: boolean
}
