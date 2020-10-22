import { SessionKey } from '@companieshouse/node-session-handler/lib/session/keys/SessionKey'
import { ISignInInfo } from '@companieshouse/node-session-handler/lib/session/model/SessionInterfaces'
import { assert } from 'chai'
import { Request } from 'express'
import sinon from 'sinon'
import { generateRequest } from '../../fixtures/http.fixtures'
import { generateDissolutionSession, generateISignInInfo } from '../../fixtures/session.fixtures'

import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import SessionService from 'app/services/session/session.service'

describe('SessionService', () => {

  let service: SessionService

  let getSessionStub: sinon.SinonStub

  beforeEach(() => {
    service = new SessionService()

    getSessionStub = sinon.stub()
  })

  describe('getAccessToken', () => {
    const TOKEN = 'some-token'

    it('should retrieve the access token from the session', () => {
      const signInInfo: ISignInInfo = generateISignInInfo()
      signInInfo.access_token!.access_token = TOKEN

      const req: Request = generateRequest()
      req.session!.get = getSessionStub.withArgs(SessionKey.SignInInfo).returns(signInInfo)

      const result: string = service.getAccessToken(req)

      assert.equal(result, TOKEN)
    })
  })

  describe('getUserEmail', () => {
    const EMAIL = 'some@mail.com'

    it(`should retrieve the logged in users email from the session`, () => {
      const signInInfo: ISignInInfo = generateISignInInfo()
      signInInfo.user_profile!.email = EMAIL

      const req: Request = generateRequest()
      req.session!.get = getSessionStub.withArgs(SessionKey.SignInInfo).returns(signInInfo)

      const result: string = service.getUserEmail(req)

      assert.equal(result, EMAIL)
    })
  })

  describe('getDissolutionSession', () => {
    it('should retrieve the dissolution object from the session', () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()

      const req: Request = generateRequest()
      req.session!.getExtraData = getSessionStub.withArgs('dissolution').returns(dissolutionSession)

      const result: Optional<DissolutionSession> = service.getDissolutionSession(req)

      assert.equal(result, dissolutionSession)
    })
  })

  describe('setDissolutionSession', () => {
    it('should set the dissolution object in the session', () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()

      const req: Request = generateRequest()

      const setExtraDataStub: sinon.SinonStub = sinon.stub()
      req.session!.setExtraData = setExtraDataStub

      service.setDissolutionSession(req, dissolutionSession)

      assert.isTrue(setExtraDataStub.withArgs('dissolution', dissolutionSession).called)
    })
  })
})
