import 'reflect-metadata'

import { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'

import { DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import { DissolutionCreateResponse } from 'app/models/dto/dissolutionCreateResponse'
import { DissolutionGetResponse } from 'app/models/dto/dissolutionGetResponse'
import Optional from 'app/models/optional'
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

  public async getDissolution(token: string, companyNumber: string): Promise<Optional<DissolutionGetResponse>> {
    const response: Optional<AxiosResponse<DissolutionGetResponse>> = await this.axios.get(
      `${this.DISSOLUTIONS_API_URL}/dissolution-request/${companyNumber}`,
      {
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      }
    ).catch((err: AxiosError) => {
      if (err.response!.status === 404) {
        return null
      } else {
        return Promise.reject(err)
      }
    })
    return (response ? response.data : null)
  }
}