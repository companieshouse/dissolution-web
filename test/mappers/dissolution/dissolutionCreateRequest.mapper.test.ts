import { assert } from 'chai'

import DissolutionRequestMapper from 'app/mappers/dissolution/dissolutionRequest.mapper'
import { DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import DirectorToSign from 'app/models/session/directorToSign.model'

import { generateDirectorsToSign } from 'test/fixtures/session.fixtures'


describe('Dissolution Request Mapper', () => {

  const mapper: DissolutionRequestMapper = new DissolutionRequestMapper()

  describe('mapToDissolutionRequest', () => {
    it('should map director array to dissolution request', () => {
      const directors: DirectorToSign[] = generateDirectorsToSign()
      const result: DissolutionCreateRequest = mapper.mapToDissolutionRequest(directors)

      result.directors.forEach((res, index) => {
        assert.equal(res.name, directors[index].name)
        assert.equal(res.email, directors[index].email)
        assert.equal(res.onBehalfName, directors[index].onBehalfName)
        assert.isFalse('id' in res)
      })
    })
  })
})