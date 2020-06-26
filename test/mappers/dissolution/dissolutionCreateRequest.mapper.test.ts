import { assert } from 'chai'

import DissolutionRequestMapper from 'app/mappers/dissolution/dissolutionRequest.mapper'
import { DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import DirectorToSign from 'app/models/session/directorToSign.model'

describe('Dissolution Request Mapper', () => {

  const mapper: DissolutionRequestMapper = new DissolutionRequestMapper()

  describe('mapToDissolutionRequest', () => {
    it('should map director array to dissolution request', () => {
      const director1: DirectorToSign = {id: '1', name: 'Ashamed Alligator', email: 'ashameda@company.com'}

      const director2: DirectorToSign = {id: '2', name: 'Sympathetic Hippopotamus', email: 'sympathetich@company.com'}

      const result: DissolutionCreateRequest = mapper.mapToDissolutionRequest([director1, director2])

      assert.equal(result.directors.length, 2)

      assert.equal(result.directors[0].name, director1.name)
      assert.equal(result.directors[0].on_behalf_name, director1.onBehalfName)
      assert.equal(result.directors[0].email, director1.email)
      assert.isFalse('id' in result.directors[0])

      assert.equal(result.directors[1].name, director2.name)
      assert.equal(result.directors[1].on_behalf_name, director2.onBehalfName)
      assert.equal(result.directors[1].email, director2.email)
      assert.isFalse('id' in result.directors[1])
    })
  })
})