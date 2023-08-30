import "reflect-metadata"

import { provide } from "inversify-binding-decorators"

import DissolutionGetDirector from "app/models/dto/dissolutionGetDirector"
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import { ViewApplicationStatus, ViewApplicationStatusSignatory } from "app/models/view/viewApplicationStatus.model"

@provide(ViewApplicationStatusMapper)
export default class ViewApplicationStatusMapper {

    public mapToViewModel (dissolutionSession: DissolutionSession, dissolution: DissolutionGetResponse, isApplicant: boolean):
  ViewApplicationStatus {
        return {
            dissolutionSession,
            showChangeColumn: isApplicant,
            signatories: dissolution.directors.map(director => this.mapToSignatory(dissolutionSession, director, isApplicant))
        }
    }

    private mapToSignatory (dissolutionSession: DissolutionSession, signatory: DissolutionGetDirector, isApplicant: boolean):
  ViewApplicationStatusSignatory {
        return {
            id: signatory.officer_id,
            name: this.mapToSignatoryDisplayName(signatory),
            email: signatory.email,
            hasApproved: !!signatory.approved_at,
            canChange: isApplicant && !signatory.approved_at,
            remindDirectorList: dissolutionSession.remindDirectorList
        }
    }

    private mapToSignatoryDisplayName (signatory: DissolutionGetDirector): string {
        return signatory.on_behalf_name
            ? `${signatory.on_behalf_name} signing on behalf of ${signatory.name}`
            : signatory.name
    }
}
