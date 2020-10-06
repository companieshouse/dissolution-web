import 'reflect-metadata'

import { CreatePaymentRequest, Payment } from 'api-sdk-node/dist/services/payment/types'
import { ApiResponse, ApiResult } from 'api-sdk-node/dist/services/resource'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import APIClientFactory from './apiClient.factory'

@provide(PaymentApiClient)
export default class PaymentApiClient {

  public constructor(@inject(APIClientFactory) private factory: APIClientFactory) {}

  public async createPayment(token: string, body: CreatePaymentRequest): Promise<ApiResponse<Payment>> {
    const response: ApiResult<ApiResponse<Payment>> = await this.factory
      .getPaymentService(token)
      .createPayment(body)

    return response.value as ApiResponse<Payment>
  }
}
