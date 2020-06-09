import 'reflect-metadata'

import ApplicationLogger from 'ch-logging/lib/ApplicationLogger'
import { instance, mock, verify, } from 'ts-mockito'
import { authMiddleware as commonMiddleware } from 'web-security-node'

import { AuthMiddleware } from 'app/middleware/auth.middleware'
import { UriFactory } from 'app/utils/uri.factory'

describe('AuthMiddleware', () => {
  it('when handling request should call common auth library', () => {
    const middleware = new AuthMiddleware(
      instance(mock(ApplicationLogger)),
      'EXAMPLE_URL',
      instance(mock(UriFactory)))

    const req = {}
    const res = {
      redirect: () => undefined
    }
    const func = () => void

    middleware.handler(req as any, res as any, func)
    verify(commonMiddleware({
      req,
      res,
      next: func()
    } as any)).called()
  })
})