import 'reflect-metadata'

import { provide } from 'inversify-binding-decorators'
import moment from 'moment'

import ApplicationType from 'app/models/dto/applicationType.enum'
import DissolutionGetDirector from 'app/models/dto/dissolutionGetDirector'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import OfficerType from 'app/models/dto/officerType.enum'
import DissolutionApprovalModel from 'app/models/form/dissolutionApproval.model'
import DissolutionConfirmation from 'app/models/session/dissolutionConfirmation.model'

@provide(DissolutionSessionMapper)
export default class DissolutionSessionMapper {

  public mapToApprovalModel(dissolution: DissolutionGetResponse, signatory: DissolutionGetDirector): DissolutionApprovalModel {
    return {
      officerId: signatory.officer_id,
      companyName: dissolution.company_name,
      companyNumber: dissolution.company_number,
      applicant: signatory.name,
      officerType: dissolution.application_type === ApplicationType.LLDS01 ? OfficerType.MEMBER : OfficerType.DIRECTOR,
      onBehalfName: signatory.on_behalf_name,
      date: moment().format('DD MMMM YYYY')
    }
  }

  public mapToDissolutionConfirmation(dissolution: DissolutionGetResponse): DissolutionConfirmation {
    return {
      certificateBucket: dissolution.certificate_bucket,
      certificateKey: dissolution.certificate_key
    }
  }
}
