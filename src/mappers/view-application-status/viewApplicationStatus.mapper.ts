import 'reflect-metadata'

import { provide } from 'inversify-binding-decorators'

import DissolutionGetDirector from 'app/models/dto/dissolutionGetDirector'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import { ViewApplicationStatus, ViewApplicationStatusSignatory } from 'app/models/view/viewApplicationStatus.model'

@provide(ViewApplicationStatusMapper)
export default class ViewApplicationStatusMapper {

  public mapToViewModel(dissolution: DissolutionGetResponse): ViewApplicationStatus {
    return {
      signatories: dissolution.directors.map(director => this.mapToSignatory(director))
    }
  }

  private mapToSignatory(signatory: DissolutionGetDirector): ViewApplicationStatusSignatory {
    return {
      id: signatory.officer_id,
      name: this.mapToSignatoryDisplayName(signatory),
      email: signatory.email,
      hasApproved: !!signatory.approved_at
    }
  }

  private mapToSignatoryDisplayName(signatory: DissolutionGetDirector): string {
    return signatory.on_behalf_name ?
      `${signatory.on_behalf_name} signing on behalf of ${signatory.name}` :
      signatory.name
  }
}
