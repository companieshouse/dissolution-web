import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { assert } from 'chai'
import sinon from 'sinon'

import PresenterAuthRequest from 'app/models/dto/presenterAuthRequest'
import PresenterAuthResponse from 'app/models/dto/presenterAuthResponse'
import PresenterApiClient from 'app/services/clients/presenterApi.client'

import { generateAxiosResponse } from 'test/fixtures/axios.fixtures'
import { generatePresenterAuthRequest, generatePresenterAuthResponse } from 'test/fixtures/payment.fixtures'

describe('PresenterApiClient', () => {

  let client: PresenterApiClient

  let axiosInstance: AxiosInstance

  let getStub: sinon.SinonStub

  const CHIPS_PRESENTER_AUTH_URL: string = 'http://presenter-api/presenterauth'

  beforeEach(() => {
    axiosInstance = axios.create()

    client = new PresenterApiClient(CHIPS_PRESENTER_AUTH_URL, axiosInstance)
  })

  describe('getAccountNumber', () => {
    it('should call the Presenter API and return the response', async () => {
      const request: PresenterAuthRequest = generatePresenterAuthRequest()
      const response: AxiosResponse = generateAxiosResponse(generatePresenterAuthResponse())

      getStub = sinon.stub().resolves(response)
      axiosInstance.get = getStub

      const result: PresenterAuthResponse = await client.getAccountNumber(request)

      assert.isTrue(getStub.called)

      const [url, config] = getStub.args[0]
      assert.equal(url, CHIPS_PRESENTER_AUTH_URL)
      assert.equal(config.params, request)

      assert.equal(result, response.data)
    })
  })
})
