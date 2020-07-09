import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import { assert } from 'chai'
import sinon from 'sinon'

import { DissolutionCreateResponse } from 'app/models/dto/dissolutionCreateResponse'
import { DissolutionGetResponse } from 'app/models/dto/dissolutionGetResponse'
import { DissolutionPatchRequest } from 'app/models/dto/dissolutionPatchRequest'
import { DissolutionPatchResponse } from 'app/models/dto/dissolutionPatchResponse'
import { DissolutionApiClient } from 'app/services/clients/dissolutionApi.client'

import { generateAxiosError, generateAxiosResponse } from 'test/fixtures/axios.fixtures'
import {
  generateDissolutionCreateRequest, generateDissolutionCreateResponse, generateDissolutionGetResponse,
  generateDissolutionPatchRequest, generateDissolutionPatchResponse
} from 'test/fixtures/dissolutionApi.fixtures'

describe('DissolutionApiClient', () => {

  let axiosInstance: AxiosInstance
  let dissolutionApiUrl: string
  let client: DissolutionApiClient
  let getStub: sinon.SinonStub
  let postStub: sinon.SinonStub
  let patchStub: sinon.SinonStub

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '12345678'
  const BODY = generateDissolutionCreateRequest()
  const GET_RESPONSE: AxiosResponse<DissolutionGetResponse> = generateAxiosResponse(generateDissolutionGetResponse())
  const CREATE_RESPONSE: AxiosResponse<DissolutionCreateResponse> = generateAxiosResponse(generateDissolutionCreateResponse())
  const PATCH_RESPONSE: AxiosResponse<DissolutionPatchResponse> = generateAxiosResponse(generateDissolutionPatchResponse())

  beforeEach(() => {
    axiosInstance = axios.create()
    dissolutionApiUrl = 'http://apiurl.com'

    client = new DissolutionApiClient(dissolutionApiUrl, axiosInstance)
  })

  describe('createDissolution', () => {
    it('should create a dissolution request in the api and return reference number', async () => {
      postStub = sinon.stub().resolves(CREATE_RESPONSE)
      axiosInstance.post = postStub

      const response = await client.createDissolution(TOKEN, COMPANY_NUMBER, BODY)

      const reqUrl: string = `${dissolutionApiUrl}/dissolution-request/${COMPANY_NUMBER}`

      assert.isTrue(postStub.called)

      const [url, body, config] = postStub.args[0]
      assert.equal(url, reqUrl)
      assert.equal(body, BODY)
      assert.equal(config.headers.Authorization, 'Bearer ' + TOKEN)
      assert.equal(config.headers['Content-Type'], 'application/json')
      assert.equal(config.headers.Accept, 'application/json')

      assert.equal(response, CREATE_RESPONSE.data)
    })
  })

  describe('getDissolution', () => {
    it('should return dissolution if dissolution is present in the database', async () => {
      getStub = sinon.stub().resolves(GET_RESPONSE)
      axiosInstance.get = getStub

      const response = await client.getDissolution(TOKEN, COMPANY_NUMBER)

      const reqUrl: string = `${dissolutionApiUrl}/dissolution-request/${COMPANY_NUMBER}`

      assert.isTrue(getStub.called)

      const [url, config] = getStub.args[0]
      assert.equal(url, reqUrl)
      assert.equal(config.headers.Authorization, 'Bearer ' + TOKEN)
      assert.equal(config.headers['Content-Type'], 'application/json')
      assert.equal(config.headers.Accept, 'application/json')

      assert.equal(response, GET_RESPONSE.data)
    })

    it('should throw an error if any other error than 404 occurs', async () => {
      const error: AxiosError = generateAxiosError(generateDissolutionGetResponse())
      error.response!.status = 400

      getStub = sinon.stub().rejects(error)
      axiosInstance.get = getStub

      try {
        await client.getDissolution(TOKEN, COMPANY_NUMBER)
        assert.fail()
      } catch (e) {
        assert.equal(e.response!.status, error.response!.status)
      }

      const reqUrl: string = `${dissolutionApiUrl}/dissolution-request/${COMPANY_NUMBER}`

      assert.isTrue(getStub.called)

      const [url, config] = getStub.args[0]
      assert.equal(url, reqUrl)
      assert.equal(config.headers.Authorization, 'Bearer ' + TOKEN)
      assert.equal(config.headers['Content-Type'], 'application/json')
      assert.equal(config.headers.Accept, 'application/json')
    })

    it('should return null if dissolution does not exist for the provided company', async () => {
      getStub = sinon.stub().rejects(
        {
          response:
            {
              status: 404
            }
        })
      axiosInstance.get = getStub

      const response = await client.getDissolution(TOKEN, COMPANY_NUMBER)

      const reqUrl: string = `${dissolutionApiUrl}/dissolution-request/${COMPANY_NUMBER}`

      assert.isTrue(getStub.called)

      const [url, config] = getStub.args[0]
      assert.equal(url, reqUrl)
      assert.equal(config.headers.Authorization, 'Bearer ' + TOKEN)
      assert.equal(config.headers['Content-Type'], 'application/json')
      assert.equal(config.headers.Accept, 'application/json')

      assert.isNull(response)
    })
  })

  describe('patchDissolution', () => {
    it('should create a dissolution request in the api and return reference number', async () => {
      const request: DissolutionPatchRequest = generateDissolutionPatchRequest()

      patchStub = sinon.stub().resolves(PATCH_RESPONSE)
      axiosInstance.patch = patchStub

      const response: DissolutionPatchResponse = await client.patchDissolution(TOKEN, COMPANY_NUMBER, request)

      const reqUrl: string = `${dissolutionApiUrl}/dissolution-request/${COMPANY_NUMBER}`

      assert.isTrue(patchStub.called)

      const [url, body, config] = patchStub.args[0]
      assert.equal(url, reqUrl)
      assert.equal(body, request)
      assert.equal(config.headers.Authorization, 'Bearer ' + TOKEN)
      assert.equal(config.headers['Content-Type'], 'application/json')
      assert.equal(config.headers.Accept, 'application/json')

      assert.equal(response, PATCH_RESPONSE.data)
    })
  })
})
