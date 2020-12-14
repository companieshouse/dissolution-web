import OfficerType from 'app/models/dto/officerType.enum'
import PaymentType from 'app/models/dto/paymentType.enum'
import { DefineSignatoryInfoFormModel } from 'app/models/form/defineSignatoryInfo.model'
import DissolutionApprovalModel from 'app/models/form/dissolutionApproval.model'
import HowDoYouWantToPayModel from 'app/models/form/howDoYouWantToPay.model'
import SelectDirectorFormModel from 'app/models/form/selectDirector.model'
import SelectSignatoriesFormModel from 'app/models/form/selectSignatories.model'
import DirectorToSign from 'app/models/session/directorToSign.model'
import DissolutionConfirmation from 'app/models/session/dissolutionConfirmation.model'

export default interface DissolutionSession {
  companyNumber?: string
  officerType?: OfficerType
  selectDirectorForm?: SelectDirectorFormModel
  selectSignatoriesForm?: SelectSignatoriesFormModel
  defineSignatoryInfoForm?: DefineSignatoryInfoFormModel
  howDoYouWantToPayForm?: HowDoYouWantToPayModel
  signatoryIdToEdit?: string
  directorsToSign?: DirectorToSign[]
  applicationReferenceNumber?: string
  approval?: DissolutionApprovalModel
  confirmation?: DissolutionConfirmation
  isMultiDirector?: boolean
  isApplicantADirector?: boolean
  paymentStateUUID?: string
  paymentType?: PaymentType
}
