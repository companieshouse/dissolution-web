import 'reflect-metadata'

import 'ch-node-session-handler'
import DissolutionSession from 'app/models/dissolutionSession'
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { Request } from 'express'
import { provide } from 'inversify-binding-decorators'

import Optional from 'app/models/optional'

@provide(SessionService)
export default class SessionService {
  private readonly DISSOLUTION_SESSION_KEY: string = 'dissolution'

  public getAccessToken(req: Request): string {
    return req.session!.get<ISignInInfo>(SessionKey.SignInInfo)!.access_token!.access_token!
  }

  public getDissolutionSession(req: Request): Optional<DissolutionSession> {
    return req.session!.getExtraData<DissolutionSession>(this.DISSOLUTION_SESSION_KEY)
  }

  public setDissolutionSession(req: Request, updatedSession: DissolutionSession): void {
    req.session!.setExtraData(this.DISSOLUTION_SESSION_KEY, updatedSession)
  }
}
