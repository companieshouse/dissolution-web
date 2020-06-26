import 'reflect-metadata'

import { provide } from 'inversify-binding-decorators'

import { DirectorRequest, DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import DirectorToSign from 'app/models/session/directorToSign.model'
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
      name: director.name,
      email: director.email!,
      on_behalf_name: director.onBehalfName
    }
  }
}