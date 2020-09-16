import 'reflect-metadata'

import 'ch-node-session-handler'
import { Session } from 'ch-node-session-handler'
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { Request } from 'express'
import { provide } from 'inversify-binding-decorators'

import { DISSOLUTION_SESSION_KEY } from 'app/constants/app.const'
import { Mutable } from 'app/models/mutable'
import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'

@provide(SessionService)
export default class SessionService {

  public getAccessToken(req: Request): string {
    return this.getSignInInfo(req).access_token!.access_token!
  }

  public getUserEmail(req: Request): string {
    return this.getSignInInfo(req).user_profile!.email!
  }

  public getDissolutionSession(req: Request): Optional<DissolutionSession> {
    return req.session!.getExtraData<DissolutionSession>(DISSOLUTION_SESSION_KEY)
  }

  public setDissolutionSession(req: Request, updatedSession: DissolutionSession): void {
    req.session!.setExtraData(DISSOLUTION_SESSION_KEY, updatedSession)
  }

  public setSession(req: Request, updatedSession: Session): void {
    req.session = updatedSession
  }

  public getSession(req: Request): Session {
    return req.session!
  }

  public getSignInInfo(req: Request): ISignInInfo {
    return req.session!.get<ISignInInfo>(SessionKey.SignInInfo)!
  }

  public setCompanyAuthNonce(req: Request, nonce: string): void {
    const mutableSession = req.session as Mutable<Session>
    mutableSession.data[SessionKey.OAuth2Nonce] = nonce
    req.session = mutableSession as Session
  }
}
