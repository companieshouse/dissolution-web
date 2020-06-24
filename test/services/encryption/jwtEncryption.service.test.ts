import { assert } from 'chai'

import JwtEncryptionService from 'app/services/encryption/jwtEncryption.service'

describe('JwtEncryptionService', () => {
  let service: JwtEncryptionService

  beforeEach(() => {

    service = new JwtEncryptionService({
      chsUrl: '',
      accountClientId: '',
      accountRequestKey: 'pXf+qkU6P6SAoY2lKW0FtKMS4PylaNA3pY2sUQxNFDk=',
      accountUrl: ''
    })
  })

  describe('generateNonce', () => {
    it('should generate random nonce value in base64', () => {

      const nonce = service.generateNonce()
      assert.match(nonce, /[A-Za-z0-9+/=]/)
      assert.equal(nonce[nonce.length - 1], '=')
    })
  })

  describe('jweEncodeWithNonce', () => {
    it('should create an encrypted state string using nonce value', async () => {
      const nonce = '2dsa='
      const state = await service.jweEncodeWithNonce('http://example.com', nonce)
      assert.match(state, /eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2Iiwia2lkIjoia2V5In0..*/)
    })
  })
})