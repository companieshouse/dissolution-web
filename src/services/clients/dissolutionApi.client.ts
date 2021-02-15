import 'reflect-metadata'

import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'

import { DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import DissolutionCreateResponse from 'app/models/dto/dissolutionCreateResponse'
import DissolutionDirectorPatchRequest from 'app/models/dto/dissolutionDirectorPatchRequest'
import DissolutionGetPaymentUIData from 'app/models/dto/dissolutionGetPaymentUIData'
import DissolutionGetResendEmailResponse from 'app/models/dto/dissolutionGetResendEmailResponse'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import DissolutionPatchRequest from 'app/models/dto/dissolutionPatchRequest'
import DissolutionPatchResponse from 'app/models/dto/dissolutionPatchResponse'
import DissolutionPaymentPatchRequest from 'app/models/dto/dissolutionPaymentPatchRequest'
import Optional from 'app/models/optional'
import TYPES from 'app/types'

@provide(DissolutionApiClient)
export class DissolutionApiClient {
  public constructor(
    @inject(TYPES.DISSOLUTIONS_API_URL) private DISSOLUTIONS_API_URL: string,
    @inject(TYPES.CHS_API_KEY) private CHS_API_KEY: string,
    @inject(TYPES.AxiosInstance) private axios: AxiosInstance
  ) {}

  public async createDissolution(token: string, companyNumber: string, body: DissolutionCreateRequest): Promise<DissolutionCreateResponse> {
    const response: AxiosResponse<DissolutionCreateResponse> = await this.axios.post(
      this.generateUrl(companyNumber),
      body,
      this.generateConfigForOAuth(token)
    )

    return response.data
  }

  public async getDissolution(token: string, companyNumber: string): Promise<Optional<DissolutionGetResponse>> {
    try {
      const response: Optional<AxiosResponse<DissolutionGetResponse>> = await this.axios.get(
        this.generateUrl(companyNumber),
        this.generateConfigForOAuth(token)
      )

      return response!.data
    } catch (err) {
      if (err.response.status === 404) {
        return null
      }

      return Promise.reject(err)
    }
  }

  public async sendEmailNotification(companyNumber: string, directorEmail: string): Promise<DissolutionGetResendEmailResponse> {
    const response: AxiosResponse<DissolutionGetResendEmailResponse> = await this.axios.post(
      `${this.DISSOLUTIONS_API_URL}/dissolution-request/${companyNumber}/resend-email/${directorEmail}`,
      companyNumber,
      this.generateConfigForAPIKey()
    )
    var res: DissolutionGetResendEmailResponse = {reminderSent: response.status == 200}
    return res
  }

  public async getDissolutionPaymentUIData(applicationReference: string): Promise<DissolutionGetPaymentUIData> {
      const response: AxiosResponse<DissolutionGetPaymentUIData> = await this.axios.get(
        `${this.DISSOLUTIONS_API_URL}/dissolution-request/${applicationReference}/payment`,
        this.generateConfigForAPIKey()
      )

      return response.data
  }

  public async patchDissolution(token: string, companyNumber: string, body: DissolutionPatchRequest): Promise<DissolutionPatchResponse> {
    const response: AxiosResponse<DissolutionPatchResponse> = await this.axios.patch(
      this.generateUrl(companyNumber),
      body,
      this.generateConfigForOAuth(token)
    )

    return response.data
  }

  public async patchDissolutionDirector(
    token: string, companyNumber: string, directorId: string, body: DissolutionDirectorPatchRequest): Promise<void> {
    await this.axios.patch(
      this.generateUrlForDirector(companyNumber, directorId),
      body,
      this.generateConfigForOAuth(token)
    )
  }

  public async patchDissolutionPaymentData(applicationReference: string, body: DissolutionPaymentPatchRequest): Promise<void> {
    return await this.axios.patch(
      `${this.DISSOLUTIONS_API_URL}/dissolution-request/${applicationReference}/payment`,
      body,
      this.generateConfigForAPIKey()
    )
  }

  private generateConfigForOAuth(token: string): AxiosRequestConfig {
    return {
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  }

  private generateConfigForAPIKey(): AxiosRequestConfig {
    return {
      headers: {
        Authorization: this.CHS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  }

  private generateUrl(companyNumber: string): string {
    return `${this.DISSOLUTIONS_API_URL}/dissolution-request/${companyNumber}`
  }

  private generateUrlForDirector(companyNumber: string, directorId: string): string {
    return `${this.generateUrl(companyNumber)}/directors/${directorId}`
  }
}
