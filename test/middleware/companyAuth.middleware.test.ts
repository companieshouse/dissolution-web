import 'reflect-metadata'

import ApplicationLogger from 'ch-logging/lib/ApplicationLogger'
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { assert } from 'chai'
import { RequestHandler, Response } from 'express'
import sinon from 'sinon'
import { mock } from 'ts-mockito'

import CompanyAuthMiddleware, { AuthConfig } from 'app/middleware/companyAuth.middleware'
import DissolutionSession from 'app/models/dissolutionSession'
import { JwtEncryptionService } from 'app/services/encryption/jwtEncryption.service'

import { generateRequest } from 'test/fixtures/http.fixtures'
import { generateDissolutionSession } from 'test/fixtures/session.fixtures'

describe('AuthMiddleware', () => {

  let middleware: RequestHandler

  let encryptionService: JwtEncryptionService
  let logger: ApplicationLogger
  let authConfig: AuthConfig

  const COMPANY_NUMBER = '12345678'

  beforeEach(() => {
    encryptionService = mock(JwtEncryptionService)
    logger = mock(ApplicationLogger)

    authConfig = {
      chsUrl: '',
      accountClientId: '',
      accountRequestKey: 'pXf+qkU6P6SAoY2lKW0FtKMS4PylaNA3pY2sUQxNFDk=',
      accountUrl: ''
    }

    middleware = CompanyAuthMiddleware(
      authConfig, encryptionService, logger
    )
  })

  it('should throw an error if no company number is present', () => {
    const req = generateRequest()
    const res = {} as Response
    const next = sinon.stub()

    middleware(req, res, next)

    const nextError = next.args[0][0]

    assert.equal(nextError.message, 'No Company Number in session')

  })

  it('should invoke next() function if user is authenticated for company number', () => {
    const signInInfo: ISignInInfo = {
      company_number: COMPANY_NUMBER
    }

    const dissolutionSession: DissolutionSession = generateDissolutionSession()
    const getExtraDataStub: sinon.SinonStub = sinon.stub().returns(dissolutionSession)
    const getSignInInfoStub: sinon.SinonStub = sinon.stub().withArgs(SessionKey.SignInInfo).returns(signInInfo)

    const req = generateRequest()
    req.session!.getExtraData = getExtraDataStub
    req.session!.get = getSignInInfoStub

    const res = {} as Response
    const next = sinon.stub().withArgs()

    middleware(req, res, next)

    assert.isTrue(next.calledOnce)
  })

  it('should redirect if user is not authenticated for company number', async() => {
    const dissolutionSession: DissolutionSession = generateDissolutionSession()
    const getExtraDataStub: sinon.SinonStub = sinon.stub().returns(dissolutionSession)

    const req = generateRequest()
    req.session!.getExtraData = getExtraDataStub

    const res = {} as Response
    const redirectStub: sinon.SinonStub = sinon.stub()
    res.redirect = redirectStub

    const next = sinon.stub()

    await middleware(req, res, next)
    assert.isTrue(redirectStub.calledOnce)
  })
})