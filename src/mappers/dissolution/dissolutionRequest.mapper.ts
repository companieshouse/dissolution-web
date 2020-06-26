import 'reflect-metadata'

import { provide } from 'inversify-binding-decorators'

import { DirectorRequest, DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import DirectorToSign from 'app/models/session/directorToSign.model'


@provide(DissolutionRequestMapper)
export default class DissolutionRequestMapper {

  public mapToDissolutionRequest(directors: DirectorToSign[]): DissolutionCreateRequest {
    const dtoDirectors: DirectorRequest[] = directors.map(d => {
      return {name: d.name, email: d.email!, onBehalfName: d.onBehalfName}
    })
    return {
      directors: dtoDirectors
    }
  }
}