import 'reflect-metadata'

import 'ch-node-session-handler'
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { Request } from 'express'
import { provide } from 'inversify-binding-decorators'

import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'

@provide(SessionService)
export default class SessionService {
  private readonly DISSOLUTION_SESSION_KEY: string = 'dissolution'

  public getAccessToken(req: Request): string {
    return this.getSignInInfo(req).access_token!.access_token!
  }

  public getUserEmail(req: Request): string {
    return this.getSignInInfo(req).user_profile!.email!
  }

  public getDissolutionSession(req: Request): Optional<DissolutionSession> {
    return req.session!.getExtraData<DissolutionSession>(this.DISSOLUTION_SESSION_KEY)
  }

  public setDissolutionSession(req: Request, updatedSession: DissolutionSession): void {
    req.session!.setExtraData(this.DISSOLUTION_SESSION_KEY, updatedSession)
  }

  private getSignInInfo(req: Request): ISignInInfo {
    return req.session!.get<ISignInInfo>(SessionKey.SignInInfo)!
  }
}
