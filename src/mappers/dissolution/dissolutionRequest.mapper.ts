import 'reflect-metadata'

import { provide } from 'inversify-binding-decorators'

import { DirectorRequest, DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import DissolutionPatchRequest from 'app/models/dto/dissolutionPatchRequest'
import { DirectorToSign } from 'app/models/session/directorToSign.model'
import DissolutionSession from 'app/models/session/dissolutionSession.model'

@provide(DissolutionRequestMapper)
export default class DissolutionRequestMapper {

  public mapToDissolutionRequest(dissolutionSession: DissolutionSession): DissolutionCreateRequest {
    return {
      directors: dissolutionSession.directorsToSign!.map(this.mapToDirectorRequest)
    }
  }

  private mapToDirectorRequest(director: DirectorToSign): DirectorRequest {
    return {
      officer_id: director.id,
      email: director.email!,
      on_behalf_name: director.onBehalfName
    }
  }

  public mapToDissolutionPatchRequest(officerId: string, ipAddress: string): DissolutionPatchRequest {
    return {
      officer_id: officerId,
      has_approved: true,
      ip_address: ipAddress
    }
  }
}
