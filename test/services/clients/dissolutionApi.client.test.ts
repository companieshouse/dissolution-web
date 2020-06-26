import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { assert } from 'chai'
import sinon from 'sinon'

import { DissolutionApiClient } from 'app/services/clients/dissolutionApi.client'

import { generateAxiosResponse } from 'test/fixtures/axios.fixtures'
import {
  generateDissolutionCreateRequest,
} from 'test/fixtures/dissolutionService.fixtures'

describe('DissolutionApiClient', () => {

  let axiosInstance: AxiosInstance
  let dissolutionApiUrl: string
  let client: DissolutionApiClient
  let postStub: sinon.SinonStub

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '12345678'
  const BODY = generateDissolutionCreateRequest()
  const RESPONSE = generateAxiosResponse({
    application_reference_number: '123ABC'
  })

  beforeEach(() => {
    axiosInstance = axios.create()
    postStub = sinon.stub().returns(RESPONSE)
    axiosInstance.post = postStub
    dissolutionApiUrl = 'http://apiurl.com'

    client = new DissolutionApiClient(dissolutionApiUrl, axiosInstance)
  })

  describe('createDissolution', () => {
    it('should create a dissolution request in the api and return reference number', async () => {
      const response = await client.createDissolution(TOKEN, COMPANY_NUMBER, BODY)

      const reqUrl: string = `${dissolutionApiUrl}/dissolution-request/${COMPANY_NUMBER}`
      const reqConfig: AxiosRequestConfig = {
        headers: {
          Authorization: 'Bearer ' + TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      }
      assert.isTrue(postStub.called)

      const [url, body, config] = postStub.args[0] // Get args from first call and marshal them into variables
      assert.equal(url, reqUrl)
      assert.equal(body, BODY)
      assert.deepEqual(config, reqConfig)

      assert.equal(response.data.application_reference_number, RESPONSE.data.application_reference_number)
    })
  })
})