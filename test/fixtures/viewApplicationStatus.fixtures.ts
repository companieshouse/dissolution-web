import { ViewApplicationStatus, ViewApplicationStatusSignatory } from 'app/models/view/viewApplicationStatus.model'
import { generateDirectorToRemind, generateDissolutionSession } from './session.fixtures'

export function generateViewApplicationStatusModel(): ViewApplicationStatus {
  return {
    dissolutionSession: generateDissolutionSession('12345678'),
    showChangeColumn: false,
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
    hasApproved: true,
    canChange: false,
    remindDirectorList: [
      generateDirectorToRemind(),
      generateDirectorToRemind(),
      generateDirectorToRemind()
    ]
  }
}
