import 'reflect-metadata'

import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'

import DissolutionRequestMapper from 'app/mappers/dissolution/dissolutionRequest.mapper'
import { DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import { DissolutionCreateResponse } from 'app/models/dto/dissolutionCreateResponse'
import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { DissolutionApiClient } from 'app/services/clients/dissolutionApi.client'

@provide(DissolutionService)
export class DissolutionService {

  constructor(
    @inject(DissolutionRequestMapper) private dissolutionRequestMapper: DissolutionRequestMapper,
    @inject(DissolutionApiClient) private client: DissolutionApiClient
  ) {}

  public async createDissolution(token: string, dissolutionSession: DissolutionSession): Promise<Optional<string>> {

    const body: DissolutionCreateRequest = this.dissolutionRequestMapper.mapToDissolutionRequest(dissolutionSession)
    const companyNumber: string = dissolutionSession.companyNumber!

    const response: DissolutionCreateResponse =  await this.client.createDissolution(token, companyNumber, body)

    return response.application_reference_number
  }
}