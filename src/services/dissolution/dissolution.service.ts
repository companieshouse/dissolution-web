import 'reflect-metadata'

import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'

import DissolutionRequestMapper from 'app/mappers/dissolution/dissolutionRequest.mapper'
import { DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import DissolutionCreateResponse from 'app/models/dto/dissolutionCreateResponse'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import DissolutionPatchRequest from 'app/models/dto/dissolutionPatchRequest'
import DissolutionPatchResponse from 'app/models/dto/dissolutionPatchResponse'
import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { DissolutionApiClient } from 'app/services/clients/dissolutionApi.client'

@provide(DissolutionService)
export default class DissolutionService {

  public constructor(
    @inject(DissolutionRequestMapper) private dissolutionRequestMapper: DissolutionRequestMapper,
    @inject(DissolutionApiClient) private client: DissolutionApiClient
  ) {}

  public async createDissolution(token: string, dissolutionSession: DissolutionSession): Promise<string> {

    const body: DissolutionCreateRequest = this.dissolutionRequestMapper.mapToDissolutionRequest(dissolutionSession)
    const companyNumber: string = dissolutionSession.companyNumber!

    const response: DissolutionCreateResponse =  await this.client.createDissolution(token, companyNumber, body)

    return response.application_reference_number
  }

  public async getDissolution(token: string, dissolutionSession: DissolutionSession): Promise<Optional<DissolutionGetResponse>> {

    const companyNumber: string = dissolutionSession.companyNumber!

    return await this.client.getDissolution(token, companyNumber)
  }

  public async approveDissolution(token: string, dissolutionSession: DissolutionSession, email: string): Promise<void> {

    const body: DissolutionPatchRequest = this.dissolutionRequestMapper.mapToDissolutionPatchRequest(email)
    const companyNumber: string = dissolutionSession.companyNumber!

   await this.client.patchDissolution(token, companyNumber, body)
  }

}
