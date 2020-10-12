import { assert } from 'chai'
import { instance, mock, verify, when } from 'ts-mockito'

import DissolutionRequestMapper from 'app/mappers/dissolution/dissolutionRequest.mapper'
import { DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import DissolutionCreateResponse from 'app/models/dto/dissolutionCreateResponse'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import DissolutionPatchRequest from 'app/models/dto/dissolutionPatchRequest'
import Optional from 'app/models/optional'
import DissolutionConfirmation from 'app/models/session/dissolutionConfirmation.model'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { DissolutionApiClient } from 'app/services/clients/dissolutionApi.client'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import DissolutionCertificateService from 'app/services/dissolution/dissolutionCertificate.service'

import {
  generateDissolutionCreateRequest,
  generateDissolutionCreateResponse, generateDissolutionGetResponse, generateDissolutionPatchRequest
} from 'test/fixtures/dissolutionApi.fixtures'
import { generateDissolutionConfirmation, generateDissolutionSession } from 'test/fixtures/session.fixtures'

describe('DissolutionService', () => {
  let service: DissolutionService

  let mapper: DissolutionRequestMapper
  let client: DissolutionApiClient
  let certificateService: DissolutionCertificateService

  let dissolutionCreateResponse: DissolutionCreateResponse
  let dissolutionGetResponse: DissolutionGetResponse
  let dissolutionSession: DissolutionSession

  const REFERENCE_NUMBER = '123ABC'
  const TOKEN = 'some-token'
  const MAPPED_BODY: DissolutionCreateRequest = generateDissolutionCreateRequest()

  beforeEach(() => {
    mapper = mock(DissolutionRequestMapper)
    client = mock(DissolutionApiClient)
    certificateService = mock(DissolutionCertificateService)

    dissolutionCreateResponse = generateDissolutionCreateResponse()
    dissolutionGetResponse = generateDissolutionGetResponse()
    dissolutionSession = generateDissolutionSession()

    service = new DissolutionService(
      instance(mapper),
      instance(client),
      instance(certificateService)
    )
  })

  describe('createDissolution', () => {
    it('should call dissolution api client and return reference number', async () => {
      when(mapper.mapToDissolutionRequest(dissolutionSession))
        .thenReturn(MAPPED_BODY)

      when(client.createDissolution(TOKEN, dissolutionSession.companyNumber!, MAPPED_BODY))
        .thenResolve(dissolutionCreateResponse)

      const res: Optional<string> = await service.createDissolution(TOKEN, dissolutionSession)

      verify(client.createDissolution(TOKEN, dissolutionSession.companyNumber!, MAPPED_BODY)).once()

      assert.equal(res, REFERENCE_NUMBER)
    })
  })

  describe('getDissolution', () => {
    it('should call dissolution api client and return dissolution info if dissolution is present', async () => {
      when(client.getDissolution(TOKEN, dissolutionSession.companyNumber!))
        .thenResolve(dissolutionGetResponse)

      const res: Optional<DissolutionGetResponse> = await service.getDissolution(TOKEN, dissolutionSession)

      verify(client.getDissolution(TOKEN, dissolutionSession.companyNumber!)).once()

      assert.equal(res, dissolutionGetResponse)
    })

    it('should call dissolution api client and return null if dissolution is not present', async () => {
      when(client.getDissolution(TOKEN, dissolutionSession.companyNumber!))
        .thenResolve(null)

      const res: Optional<DissolutionGetResponse> = await service.getDissolution(TOKEN, dissolutionSession)

      verify(client.getDissolution(TOKEN, dissolutionSession.companyNumber!)).once()

      assert.equal(res, null)
    })
  })

  describe('approveDissolution', () => {
    it('should call dissolution api client to approve the dissolution for the provided email', async () => {
      const email: string = 'test@email.com'
      const body: DissolutionPatchRequest = generateDissolutionPatchRequest()

      when(mapper.mapToDissolutionPatchRequest(email)).thenReturn(body)

      await service.approveDissolution(TOKEN, dissolutionSession, email)

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
