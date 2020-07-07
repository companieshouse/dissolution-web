import DissolutionApprovalModel from 'app/models/form/dissolutionApproval.model'
import SelectDirectorFormModel from 'app/models/form/selectDirector.model'
import DirectorToSign from 'app/models/session/directorToSign.model'

export default interface DissolutionSession {
  companyNumber?: string
  selectDirectorForm?: SelectDirectorFormModel
  directorsToSign?: DirectorToSign[],
  applicationReferenceNumber?: string,
  approval?: DissolutionApprovalModel
}