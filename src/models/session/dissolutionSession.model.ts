import DissolutionConfirmation from './dissolutionConfirmation.model'

import OfficerType from 'app/models/dto/officerType.enum'
import { DefineSignatoryInfoFormModel } from 'app/models/form/defineSignatoryInfo.model'
import DissolutionApprovalModel from 'app/models/form/dissolutionApproval.model'
import SelectDirectorFormModel from 'app/models/form/selectDirector.model'
import SelectSignatoriesFormModel from 'app/models/form/selectSignatories.model'
import DirectorToSign from 'app/models/session/directorToSign.model'

export default interface DissolutionSession {
  companyNumber?: string
  officerType?: OfficerType
  selectDirectorForm?: SelectDirectorFormModel
  selectSignatoriesForm?: SelectSignatoriesFormModel
  defineSignatoryInfoForm?: DefineSignatoryInfoFormModel
  directorsToSign?: DirectorToSign[]
  applicationReferenceNumber?: string
  approval?: DissolutionApprovalModel
  confirmation?: DissolutionConfirmation
  isMultiDirector?: boolean
  isApplicantADirector?: boolean
  paymentStateUUID?: string
}