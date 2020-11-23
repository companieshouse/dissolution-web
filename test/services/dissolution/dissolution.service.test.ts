import { assert } from 'chai'
import { instance, mock, verify, when } from 'ts-mockito'
import { generatePaymentSummary } from '../../fixtures/payment.fixtures'

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
import DissolutionService from 'app/services/dissolution/dissolution.service'
import DissolutionCertificateService from 'app/services/dissolution/dissolutionCertificate.service'

import {
  generateApprovalModel, generateDissolutionCreateRequest, generateDissolutionCreateResponse, generateDissolutionGetPaymentUIData,
  generateDissolutionGetResponse, generateDissolutionPatchRequest, generateDissolutionPaymentPatchRequest
} from 'test/fixtures/dissolutionApi.fixtures'
import { generateDissolutionConfirmation, generateDissolutionSession } from 'test/fixtures/session.fixtures'

describe('DissolutionService', () => {
  let service: DissolutionService

  let dissolutionRequestMapper: DissolutionRequestMapper
  let client: DissolutionApiClient
  let certificateService: DissolutionCertificateService
  let paymentMapper: PaymentMapper

  let dissolutionCreateResponse: DissolutionCreateResponse
  let dissolutionGetResponse: DissolutionGetResponse
  let dissolutionSession: DissolutionSession

  const REFERENCE_NUMBER = '123ABC'
  const TOKEN = 'some-token'
  const MAPPED_BODY: DissolutionCreateRequest = generateDissolutionCreateRequest()

  beforeEach(() => {
    dissolutionRequestMapper = mock(DissolutionRequestMapper)
    client = mock(DissolutionApiClient)
    certificateService = mock(DissolutionCertificateService)
    paymentMapper = mock(PaymentMapper)

    dissolutionCreateResponse = generateDissolutionCreateResponse()
    dissolutionGetResponse = generateDissolutionGetResponse()
    dissolutionSession = generateDissolutionSession()

    service = new DissolutionService(
      instance(dissolutionRequestMapper),
      instance(client),
      instance(certificateService),
      instance(paymentMapper)
    )
  })

  describe('createDissolution', () => {
    it('should call dissolution api client and return reference number', async () => {
      when(dissolutionRequestMapper.mapToDissolutionRequest(dissolutionSession)).thenReturn(MAPPED_BODY)

      when(client.createDissolution(TOKEN, dissolutionSession.companyNumber!, MAPPED_BODY)).thenResolve(dissolutionCreateResponse)

      const res: Optional<string> = await service.createDissolution(TOKEN, dissolutionSession)

      verify(client.createDissolution(TOKEN, dissolutionSession.companyNumber!, MAPPED_BODY)).once()

      assert.equal(res, REFERENCE_NUMBER)
    })
  })

  describe('getDissolution', () => {
    it('should call dissolution api client and return dissolution info if dissolution is present', async () => {
      when(client.getDissolution(TOKEN, dissolutionSession.companyNumber!)).thenResolve(dissolutionGetResponse)

      const res: Optional<DissolutionGetResponse> = await service.getDissolution(TOKEN, dissolutionSession)

      verify(client.getDissolution(TOKEN, dissolutionSession.companyNumber!)).once()

      assert.equal(res, dissolutionGetResponse)
    })

    it('should call dissolution api client and return null if dissolution is not present', async () => {
      when(client.getDissolution(TOKEN, dissolutionSession.companyNumber!)).thenResolve(null)

      const res: Optional<DissolutionGetResponse> = await service.getDissolution(TOKEN, dissolutionSession)

      verify(client.getDissolution(TOKEN, dissolutionSession.companyNumber!)).once()

      assert.equal(res, null)
    })
  })

  describe('getDissolutionPaymentSummary', () => {
    let dissolutionGetPaymentUIData: DissolutionGetPaymentUIData
    let paymentSummary: PaymentSummary

    before(() => {
      dissolutionGetPaymentUIData = generateDissolutionGetPaymentUIData()
      paymentSummary = generatePaymentSummary()
    })

    it('should call dissolution api client and return the dissolution payment summary', async () => {
      when(client.getDissolutionPaymentUIData(dissolutionSession.applicationReferenceNumber!)).thenResolve(dissolutionGetPaymentUIData)
      when(paymentMapper.mapToPaymentSummary(dissolutionGetPaymentUIData)).thenReturn(paymentSummary)

      const response: PaymentSummary = await service.getDissolutionPaymentSummary(dissolutionSession)

      verify(client.getDissolutionPaymentUIData(dissolutionSession.applicationReferenceNumber!)).once()

      assert.equal(response, paymentSummary)
    })
  })

  describe('addPayByAccountPaymentData', () => {
    const accountNumber: string = '222222'
    const dissolutionPaymentPatchRequest: DissolutionPaymentPatchRequest = generateDissolutionPaymentPatchRequest()

    it('should call dissolution api client to update the payment data of a dissolution', async () => {
      when(paymentMapper.mapToPayByAccountPaymentPatchRequest(dissolutionSession, accountNumber)).thenReturn(dissolutionPaymentPatchRequest)

      await service.addPayByAccountPaymentData(dissolutionSession, accountNumber)

      verify(client.patchDissolutionPaymentData(dissolutionSession.applicationReferenceNumber!, dissolutionPaymentPatchRequest)).once()
    })
  })

  describe('approveDissolution', () => {
    it('should call dissolution api client to approve the dissolution for the provided email', async () => {
      const officerId: string = 'abc123'
      const ipAddress: string = '127.0.0.1'
      dissolutionSession.approval = { ...generateApprovalModel(), officerId }

      const body: DissolutionPatchRequest = generateDissolutionPatchRequest()

      when(dissolutionRequestMapper.mapToDissolutionPatchRequest(officerId, ipAddress)).thenReturn(body)

      await service.approveDissolution(TOKEN, dissolutionSession, ipAddress)

      verify(client.patchDissolution(TOKEN, dissolutionSession.companyNumber!, body)).once()
    })
  })

  describe('generateDissolutionCertificateUrl', () => {
    it('should generate a URL to download the certificate and return it', async () => {
      const certificateUrl: string = 'http://some-certificate-url'
      const confirmation: DissolutionConfirmation = generateDissolutionConfirmation()

      when(certificateService.generateDissolutionCertificateUrl(confirmation)).thenResolve(certificateUrl)

      const result: string = await service.generateDissolutionCertificateUrl(confirmation)

      assert.equal(result, certificateUrl)

      verify(certificateService.generateDissolutionCertificateUrl(confirmation)).once()
    })
  })
})
