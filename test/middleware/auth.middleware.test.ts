import 'reflect-metadata'

import { assert } from 'chai'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import * as sinon from 'sinon'
import { instance, mock, when } from 'ts-mockito'
import { AuthOptions } from 'web-security-node'

import AuthMiddleware from 'app/middleware/auth.middleware'
import { SEARCH_COMPANY_URI } from 'app/paths'
import UriFactory from 'app/utils/uri.factory'

describe('AuthMiddleware', () => {

  let middleware: RequestHandler

  let uriFactory: UriFactory
  let commonAuthStub: sinon.SinonStub
  let authCallbackStub: sinon.SinonStub

  const accountWebUrl = 'some-account-url'

  beforeEach(() => {
    uriFactory = mock(UriFactory)
    authCallbackStub = sinon.stub()
    commonAuthStub = sinon.stub().returns(authCallbackStub)

    middleware = AuthMiddleware(
      accountWebUrl,
      instance(uriFactory),
      commonAuthStub
    )
  })

  it('should invoke common auth library with correct values when handling incoming request', () => {
    const req = {} as Request
    const res = {} as Response
    const next = {} as NextFunction

    const expectedAuthOptions: AuthOptions = {
      accountWebUrl,
      returnUrl: 'some-uri'
    }

    when(uriFactory.createAbsoluteUri(req, SEARCH_COMPANY_URI)).thenReturn('some-uri')

    middleware(req, res, next)

    assert.isTrue(commonAuthStub.calledOnce)

    const actualAuthOptions: AuthOptions = commonAuthStub.args[0][0]
    assert.deepEqual(actualAuthOptions, expectedAuthOptions)

    assert.isTrue(authCallbackStub.calledOnceWith(req, res, next))
  })
})
