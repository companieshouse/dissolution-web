import { assert } from 'chai'
import { instance, mock, verify, when } from 'ts-mockito'

import DissolutionRequestMapper from 'app/mappers/dissolution/dissolutionRequest.mapper'
import { DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import { DissolutionCreateResponse } from 'app/models/dto/dissolutionCreateResponse'
import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { DissolutionApiClient } from 'app/services/clients/dissolutionApi.client'
import { DissolutionService } from 'app/services/dissolution/dissolution.service'

import { generateAxiosResponse } from 'test/fixtures/axios.fixtures'
import { generateDissolutionCreateRequest } from 'test/fixtures/dissolutionApi.fixtures'
import { generateDissolutionSession } from 'test/fixtures/session.fixtures'

describe('DissolutionService', () => {
  let mapper: DissolutionRequestMapper
  let client: DissolutionApiClient
  let service: DissolutionService

  let dissolutionCreateResponse: DissolutionCreateResponse
  let dissolutionSession: DissolutionSession

  const REFERENCE_NUMBER = '123ABC'
  const TOKEN = 'some-token'
  const MAPPED_BODY: DissolutionCreateRequest = generateDissolutionCreateRequest()

  beforeEach(() => {
    mapper = mock(DissolutionRequestMapper)
    client = mock(DissolutionApiClient)

    dissolutionCreateResponse = generateAxiosResponse({application_reference_number: REFERENCE_NUMBER}).data
    dissolutionSession = generateDissolutionSession()

    when(mapper.mapToDissolutionRequest(dissolutionSession))
      .thenReturn(MAPPED_BODY)

    when(client.createDissolution(TOKEN, dissolutionSession.companyNumber!, MAPPED_BODY))
      .thenResolve(dissolutionCreateResponse)

    service = new DissolutionService(instance(mapper), instance(client))
  })

  it('should call dissolution api client and return reference number', async () => {
    const res: Optional<string> = await service.createDissolution(TOKEN, dissolutionSession)

    verify(client.createDissolution(TOKEN, dissolutionSession.companyNumber!, MAPPED_BODY)).once()

    assert.equal(res, REFERENCE_NUMBER)
  })
})