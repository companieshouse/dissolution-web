import 'reflect-metadata'

import { provide } from 'inversify-binding-decorators'

import DissolutionGetDirector from 'app/models/dto/dissolutionGetDirector'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import { ViewApplicationStatus, ViewApplicationStatusSignatory } from 'app/models/view/viewApplicationStatus.model'

@provide(ViewApplicationStatusMapper)
export default class ViewApplicationStatusMapper {

  public mapToViewModel(dissolution: DissolutionGetResponse, isApplicant: boolean): ViewApplicationStatus {
    return {
      showChangeColumn: isApplicant,
      signatories: dissolution.directors.map(director => this.mapToSignatory(director, isApplicant))
    }
  }

  private mapToSignatory(signatory: DissolutionGetDirector, isApplicant: boolean): ViewApplicationStatusSignatory {
    return {
      id: signatory.officer_id,
      name: this.mapToSignatoryDisplayName(signatory),
      email: signatory.email,
      hasApproved: !!signatory.approved_at,
      canChange: isApplicant && !signatory.approved_at
    }
  }

  private mapToSignatoryDisplayName(signatory: DissolutionGetDirector): string {
    return signatory.on_behalf_name ?
      `${signatory.on_behalf_name} signing on behalf of ${signatory.name}` :
      signatory.name
  }
}
