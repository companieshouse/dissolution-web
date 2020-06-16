import 'reflect-metadata'

import 'ch-node-session-handler'
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { Request } from 'express'
import { provide } from 'inversify-binding-decorators'

@provide(SessionService)
export default class SessionService {

  public getAccessToken(req: Request): string {
    return req.session!.get<ISignInInfo>(SessionKey.SignInInfo)!.access_token!.access_token!
  }
}
