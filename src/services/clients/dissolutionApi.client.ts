import 'reflect-metadata'

import { AxiosInstance, AxiosResponse } from 'axios'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'

import { DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import { DissolutionCreateResponse } from 'app/models/dto/dissolutionCreateResponse'
import TYPES from 'app/types'

@provide(DissolutionApiClient)
export class DissolutionApiClient {
  public constructor(
    @inject(TYPES.DISSOLUTIONS_API_URL) private DISSOLUTIONS_API_URL: string,
    @inject(TYPES.AxiosInstance) private axios: AxiosInstance
  ) {}

  public async createDissolution(token: string, companyNumber: string,
                                 body: DissolutionCreateRequest): Promise<DissolutionCreateResponse> {
    const response: AxiosResponse<DissolutionCreateResponse> = await this.axios.post(
      `${this.DISSOLUTIONS_API_URL}/dissolution-request/${companyNumber}`,
      body,
      {
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      }
    )
    return response.data
  }
}