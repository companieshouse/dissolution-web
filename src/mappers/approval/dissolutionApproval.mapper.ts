import 'reflect-metadata'

import { provide } from 'inversify-binding-decorators'
import moment from 'moment'

import DissolutionGetDirector from 'app/models/dto/dissolutionGetDirector'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import DissolutionApprovalModel from 'app/models/form/dissolutionApproval.model'

@provide(DissolutionApprovalMapper)
export default class DissolutionApprovalMapper {

  public mapToApprovalModel(dissolution: DissolutionGetResponse, signatory: DissolutionGetDirector): DissolutionApprovalModel {
    return {
      companyName: dissolution.company_name,
      companyNumber: dissolution.company_number,
      applicant: signatory.name,
      onBehalfName: signatory.on_behalf_name,
      date: moment().format('DD MMMM YYYY')
    }
  }
}
