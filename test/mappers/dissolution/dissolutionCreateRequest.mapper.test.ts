import { assert } from 'chai'

import DissolutionRequestMapper from 'app/mappers/dissolution/dissolutionRequest.mapper'
import { DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import DirectorToSign from 'app/models/session/directorToSign.model'
import DissolutionSession from 'app/models/session/dissolutionSession.model'

import { generateDirectorToSign, generateDissolutionSession } from 'test/fixtures/session.fixtures'

describe('Dissolution Request Mapper', () => {

  const mapper: DissolutionRequestMapper = new DissolutionRequestMapper()

  describe('mapToDissolutionRequest', () => {
    it('should map director array to dissolution request', () => {
      const director1: DirectorToSign = generateDirectorToSign()
      director1.name = 'Ashamed Alligator'
      director1.id = '1'
      director1.email = 'ashamed_alligator@test.com'
      const director2: DirectorToSign = generateDirectorToSign()
      director2.name = 'Sympathetic Hippopotamus'
      director2.id = '2'
      director2.email = 'sympathetic_hippopotamus@test.com'

      const dissolutionSession: DissolutionSession = generateDissolutionSession()
      dissolutionSession.directorsToSign = [director1, director2]

      const result: DissolutionCreateRequest = mapper.mapToDissolutionRequest(dissolutionSession)

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