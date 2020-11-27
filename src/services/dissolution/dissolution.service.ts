import 'reflect-metadata'

import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import DissolutionCertificateService from './dissolutionCertificate.service'

import DissolutionRequestMapper from 'app/mappers/dissolution/dissolutionRequest.mapper'
import PaymentMapper from 'app/mappers/payment/payment.mapper'
import { DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import DissolutionCreateResponse from 'app/models/dto/dissolutionCreateResponse'
import DissolutionGetPaymentUIData from 'app/models/dto/dissolutionGetPaymentUIData'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import DissolutionPatchRequest from 'app/models/dto/dissolutionPatchRequest'
import DissolutionPaymentPatchRequest from 'app/models/dto/dissolutionPaymentPatchRequest'
import PaymentSummary from 'app/models/dto/paymentSummary'
import Optional from 'app/models/optional'
import DissolutionConfirmation from 'app/models/session/dissolutionConfirmation.model'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { DissolutionApiClient } from 'app/services/clients/dissolutionApi.client'

@provide(DissolutionService)
export default class DissolutionService {

  public constructor(
    @inject(DissolutionRequestMapper) private dissolutionRequestMapper: DissolutionRequestMapper,
    @inject(DissolutionApiClient) private client: DissolutionApiClient,
    @inject(DissolutionCertificateService) private certificateService: DissolutionCertificateService,
    @inject(PaymentMapper) private paymentMapper: PaymentMapper
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

  public async getDissolutionPaymentSummary(dissolutionSession: DissolutionSession): Promise<PaymentSummary> {
    const applicationReference: string = dissolutionSession.applicationReferenceNumber!

    const dissolutionGetPaymentUIData: DissolutionGetPaymentUIData = await this.client.getDissolutionPaymentUIData(applicationReference)

    return this.paymentMapper.mapToPaymentSummary(dissolutionGetPaymentUIData)
  }

  public async addPayByAccountPaymentData(dissolutionSession: DissolutionSession, accountNumber: string): Promise<void> {
    const applicationReference: string = dissolutionSession.applicationReferenceNumber!

    const dissolutionPaymentPatchRequest: DissolutionPaymentPatchRequest = this.paymentMapper.mapToPayByAccountPaymentPatchRequest(
      dissolutionSession, accountNumber
    )

    return await this.client.patchDissolutionPaymentData(applicationReference, dissolutionPaymentPatchRequest)
  }

  public async approveDissolution(token: string, dissolution: DissolutionSession, ipAddress: string): Promise<void> {
    const body: DissolutionPatchRequest = this.dissolutionRequestMapper.mapToDissolutionPatchRequest(
      dissolution.approval!.officerId,
      ipAddress
    )
    const companyNumber: string = dissolution.companyNumber!

    await this.client.patchDissolution(token, companyNumber, body)
  }

  public async generateDissolutionCertificateUrl(confirmation: DissolutionConfirmation): Promise<string> {
    return this.certificateService.generateDissolutionCertificateUrl(confirmation)
  }
}
