import 'reflect-metadata'

import { AxiosInstance, AxiosResponse } from 'axios'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'

import PresenterAuthRequest from 'app/models/dto/presenterAuthRequest'
import PresenterAuthResponse from 'app/models/dto/presenterAuthResponse'
import TYPES from 'app/types'

@provide(PresenterApiClient)
export default class PresenterApiClient {

  public constructor(
    @inject(TYPES.CHIPS_PRESENTER_AUTH_URL) private CHIPS_PRESENTER_AUTH_URL: string,
    @inject(TYPES.AxiosInstance) private axios: AxiosInstance) {}

  public async getAccountNumber(params: PresenterAuthRequest): Promise<PresenterAuthResponse> {
    const response: AxiosResponse<PresenterAuthResponse> = await this.axios.get(this.CHIPS_PRESENTER_AUTH_URL, { params })
    return response.data
  }
}
