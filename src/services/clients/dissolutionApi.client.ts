import 'reflect-metadata'

import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'

import { DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import DissolutionCreateResponse from 'app/models/dto/dissolutionCreateResponse'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import DissolutionPatchRequest from 'app/models/dto/dissolutionPatchRequest'
import DissolutionPatchResponse from 'app/models/dto/dissolutionPatchResponse'
import Optional from 'app/models/optional'
import TYPES from 'app/types'

@provide(DissolutionApiClient)
export class DissolutionApiClient {
  public constructor(
    @inject(TYPES.DISSOLUTIONS_API_URL) private DISSOLUTIONS_API_URL: string,
    @inject(TYPES.AxiosInstance) private axios: AxiosInstance
  ) {}

  public async createDissolution(token: string, companyNumber: string, body: DissolutionCreateRequest): Promise<DissolutionCreateResponse> {
    const response: AxiosResponse<DissolutionCreateResponse> = await this.axios.post(
      this.generateUrl(companyNumber),
      body,
      this.generateConfig(token)
    )
    return response.data
  }

  public async getDissolution(token: string, companyNumber: string): Promise<Optional<DissolutionGetResponse>> {
    try {
      const response: Optional<AxiosResponse<DissolutionGetResponse>> = await this.axios.get(
        this.generateUrl(companyNumber),
        this.generateConfig(token)
      )

      return response!.data
    } catch (err) {
      if (err.response!.status === 404) {
        return null
      }

      return Promise.reject(err)
    }
  }

  public async patchDissolution(token: string, companyNumber: string, body: DissolutionPatchRequest): Promise<DissolutionPatchResponse> {
    const response: AxiosResponse<DissolutionPatchResponse> = await this.axios.patch(
      this.generateUrl(companyNumber),
      body,
      this.generateConfig(token)
    )
    return response.data
  }

  private generateConfig(token: string): AxiosRequestConfig {
    return {
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    }
  }

  private generateUrl(companyNumber: string): string {
    return `${this.DISSOLUTIONS_API_URL}/dissolution-request/${companyNumber}`
  }
}
