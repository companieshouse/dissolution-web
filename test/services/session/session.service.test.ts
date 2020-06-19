import DissolutionSession from 'app/models/dissolutionSession'
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { assert } from 'chai'
import { Request } from 'express'
import sinon from 'sinon'
import { generateRequest } from '../../fixtures/http.fixtures'
import { generateDissolutionSession, generateISignInInfo } from '../../fixtures/session.fixtures'

import Optional from 'app/models/optional'
import SessionService from 'app/services/session/session.service'

describe('SessionService', () => {

  let service: SessionService

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '12345678'

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

  describe('getDissolutionSession', () => {
    it('should retrieve the dissolution object from the session', () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()
      dissolutionSession.companyNumber = COMPANY_NUMBER

      const req: Request = generateRequest()
      req.session!.getExtraData = getSessionStub.withArgs('dissolution').returns(dissolutionSession)

      const result: Optional<DissolutionSession> = service.getDissolutionSession(req)

      assert.equal(result, dissolutionSession)
    })
  })

  describe('setDissolutionSession', () => {
    it('should set the dissolution object in the session', () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()
      dissolutionSession.companyNumber = COMPANY_NUMBER

      const req: Request = generateRequest()

      const setExtraDataStub: sinon.SinonStub = sinon.stub()
      req.session!.setExtraData = setExtraDataStub

      service.setDissolutionSession(req, dissolutionSession)

      assert.isTrue(setExtraDataStub.withArgs('dissolution', dissolutionSession).called)
    })
  })
})