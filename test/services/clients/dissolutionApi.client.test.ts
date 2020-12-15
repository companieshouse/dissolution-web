import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import { assert } from 'chai'
import { StatusCodes } from 'http-status-codes'
import sinon from 'sinon'
import { TOKEN } from '../../fixtures/session.fixtures'

import DissolutionCreateResponse from 'app/models/dto/dissolutionCreateResponse'
import DissolutionDirectorPatchRequest from 'app/models/dto/dissolutionDirectorPatchRequest'
import DissolutionGetPaymentUIData from 'app/models/dto/dissolutionGetPaymentUIData'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import DissolutionPatchRequest from 'app/models/dto/dissolutionPatchRequest'
import DissolutionPatchResponse from 'app/models/dto/dissolutionPatchResponse'
import DissolutionPaymentPatchRequest from 'app/models/dto/dissolutionPaymentPatchRequest'
import { DissolutionApiClient } from 'app/services/clients/dissolutionApi.client'

import { generateAxiosError, generateAxiosResponse } from 'test/fixtures/axios.fixtures'
import {
  generateDissolutionCreateRequest, generateDissolutionCreateResponse, generateDissolutionDirectorPatchRequest,
  generateDissolutionGetPaymentUIData, generateDissolutionGetResponse, generateDissolutionPatchRequest,
  generateDissolutionPatchResponse, generateDissolutionPaymentPatchRequest
} from 'test/fixtures/dissolutionApi.fixtures'

describe('DissolutionApiClient', () => {

  let axiosInstance: AxiosInstance
  let client: DissolutionApiClient
  let getStub: sinon.SinonStub
  let postStub: sinon.SinonStub
  let patchStub: sinon.SinonStub

  const DISSOLUTION_API_URL = 'http://apiurl.com'
  const API_KEY = 'some-api-key'
  const APPLICATION_REFERENCE = 'ABC123'
  const COMPANY_NUMBER = '12345678'
  const BODY = generateDissolutionCreateRequest()
  const GET_RESPONSE: AxiosResponse<DissolutionGetResponse> = generateAxiosResponse(generateDissolutionGetResponse())
  const CREATE_RESPONSE: AxiosResponse<DissolutionCreateResponse> = generateAxiosResponse(generateDissolutionCreateResponse())
  const PATCH_RESPONSE: AxiosResponse<DissolutionPatchResponse> = generateAxiosResponse(generateDissolutionPatchResponse())

  beforeEach(() => {
    axiosInstance = axios.create()

    client = new DissolutionApiClient(DISSOLUTION_API_URL, API_KEY, axiosInstance)
  })

  describe('createDissolution', () => {
    it('should create a dissolution request in the api and return reference number', async () => {
      postStub = sinon.stub().resolves(CREATE_RESPONSE)
      axiosInstance.post = postStub

      const response = await client.createDissolution(TOKEN, COMPANY_NUMBER, BODY)

      const reqUrl: string = `${DISSOLUTION_API_URL}/dissolution-request/${COMPANY_NUMBER}`

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
    it('should return dissolution if dissolution is returned from the API', async () => {
      getStub = sinon.stub().resolves(GET_RESPONSE)
      axiosInstance.get = getStub

      const response = await client.getDissolution(TOKEN, COMPANY_NUMBER)

      const reqUrl: string = `${DISSOLUTION_API_URL}/dissolution-request/${COMPANY_NUMBER}`

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
      error.response!.status = StatusCodes.BAD_REQUEST

      getStub = sinon.stub().rejects(error)
      axiosInstance.get = getStub

      try {
        await client.getDissolution(TOKEN, COMPANY_NUMBER)
        assert.fail()
      } catch (e) {
        assert.equal(e.response!.status, error.response!.status)
      }

      const reqUrl: string = `${DISSOLUTION_API_URL}/dissolution-request/${COMPANY_NUMBER}`

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
              status: StatusCodes.NOT_FOUND
            }
        })
      axiosInstance.get = getStub

      const response = await client.getDissolution(TOKEN, COMPANY_NUMBER)

      const reqUrl: string = `${DISSOLUTION_API_URL}/dissolution-request/${COMPANY_NUMBER}`

      assert.isTrue(getStub.called)

      const [url, config] = getStub.args[0]
      assert.equal(url, reqUrl)
      assert.equal(config.headers.Authorization, 'Bearer ' + TOKEN)
      assert.equal(config.headers['Content-Type'], 'application/json')
      assert.equal(config.headers.Accept, 'application/json')

      assert.isNull(response)
    })
  })

  describe('getDissolutionPaymentUIData', () => {
    const GET_PAYMENT_UI_DATA_RESPONSE: AxiosResponse<DissolutionGetPaymentUIData> =
      generateAxiosResponse(generateDissolutionGetPaymentUIData())

    let getPaymentUIDataStub: sinon.SinonStub

    it('should return dissolution payment UI data from the API', async () => {
      getPaymentUIDataStub = sinon.stub().resolves(GET_PAYMENT_UI_DATA_RESPONSE)
      axiosInstance.get = getPaymentUIDataStub

      const response = await client.getDissolutionPaymentUIData(APPLICATION_REFERENCE)

      const reqUrl: string = `${DISSOLUTION_API_URL}/dissolution-request/${APPLICATION_REFERENCE}/payment`

      assert.isTrue(getPaymentUIDataStub.called)

      const [url, config] = getPaymentUIDataStub.args[0]
      assert.equal(url, reqUrl)
      assert.equal(config.headers.Authorization, API_KEY)
      assert.equal(config.headers['Content-Type'], 'application/json')
      assert.equal(config.headers.Accept, 'application/json')
      assert.equal(response, GET_PAYMENT_UI_DATA_RESPONSE.data)
    })
  })

  describe('patchDissolution', () => {
    it('should update a dissolution from the dissolution patch request', async () => {
      const request: DissolutionPatchRequest = generateDissolutionPatchRequest()

      patchStub = sinon.stub().resolves(PATCH_RESPONSE)
      axiosInstance.patch = patchStub

      const response: DissolutionPatchResponse = await client.patchDissolution(TOKEN, COMPANY_NUMBER, request)

      const reqUrl: string = `${DISSOLUTION_API_URL}/dissolution-request/${COMPANY_NUMBER}`

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

  describe('patchDissolutionDirector', () => {
    const DIRECTOR_ID: string = 'abc123'

    it('should update a dissolution director from the dissolution director patch request', async () => {
      const request: DissolutionDirectorPatchRequest = generateDissolutionDirectorPatchRequest()

      patchStub = sinon.stub().resolves()
      axiosInstance.patch = patchStub

      await client.patchDissolutionDirector(TOKEN, COMPANY_NUMBER, DIRECTOR_ID, request)

      const reqUrl: string = `${DISSOLUTION_API_URL}/dissolution-request/${COMPANY_NUMBER}/directors/${DIRECTOR_ID}`

      assert.isTrue(patchStub.called)

      const [url, body, config] = patchStub.args[0]
      assert.equal(url, reqUrl)
      assert.equal(body, request)
      assert.equal(config.headers.Authorization, 'Bearer ' + TOKEN)
      assert.equal(config.headers['Content-Type'], 'application/json')
      assert.equal(config.headers.Accept, 'application/json')
    })
  })

  describe('patchDissolutionPaymentData', () => {
    const request: DissolutionPaymentPatchRequest = generateDissolutionPaymentPatchRequest()

    it('should update the payment details of a dissolution from the dissolution payment patch request', () => {
      patchStub = sinon.stub().resolves()
      axiosInstance.patch = patchStub

      assert.doesNotThrow(async () => await client.patchDissolutionPaymentData(APPLICATION_REFERENCE, request))

      assert.isTrue(patchStub.called)
    })

    it('should throw an error if there was an issue with the request', async () => {
      const error: AxiosError = generateAxiosError({})
      error.response!.status = StatusCodes.INTERNAL_SERVER_ERROR

      patchStub = sinon.stub().rejects(error)
      axiosInstance.patch = patchStub

      try {
        await client.patchDissolutionPaymentData(APPLICATION_REFERENCE, request)
        assert.fail()
      } catch (err) {
        assert.equal(err.response!.status, error.response!.status)
      }

      assert.isTrue(patchStub.called)
    })
  })
})
