import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { assert } from 'chai'
import { Request } from 'express'
import sinon from 'sinon'
import { generateRequest } from '../../fixtures/http.fixtures'
import { generateISignInInfo } from '../../fixtures/session.fixtures'

import SessionService from 'app/services/session/session.service'

describe('SessionService', () => {

  let service: SessionService

  const TOKEN = 'some-token'

  let getSessionStub: sinon.SinonStub

  beforeEach(() => {
    service = new SessionService()

    getSessionStub = sinon.stub()
  })

  describe('getAccessToken', () => {
    it('should retrieve the access token from the session', () => {
      const signInInfo: ISignInInfo = generateISignInInfo()
      signInInfo.access_token!.access_token = TOKEN

      const req: Request = generateRequest()
      req.session!.get = getSessionStub.withArgs(SessionKey.SignInInfo).returns(signInInfo)

      const result: string = service.getAccessToken(req)

      assert.equal(result, TOKEN)
    })
  })
})
