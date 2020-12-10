import { ViewApplicationStatus, ViewApplicationStatusSignatory } from 'app/models/view/viewApplicationStatus.model'

export function generateViewApplicationStatusModel(): ViewApplicationStatus {
  return {
    signatories: [
      generateViewApplicationStatusSignatory()
    ]
  }
}

export function generateViewApplicationStatusSignatory(): ViewApplicationStatusSignatory {
  return {
    id: 'abc123',
    name: 'Jane Smith',
    email: 'test@mail.com',
    hasApproved: true
  }
}