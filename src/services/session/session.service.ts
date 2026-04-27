import "reflect-metadata"

import {Session} from "@companieshouse/node-session-handler"

import {SessionKey} from "@companieshouse/node-session-handler/lib/session/keys/SessionKey"
import {ISignInInfo} from "@companieshouse/node-session-handler/lib/session/model/SessionInterfaces"
import {Request} from "express"
import {provide} from "inversify-binding-decorators"

import {DISSOLUTION_SESSION_KEY} from "app/constants/app.const"

import {Mutable} from "app/models/mutable"
import Optional from "app/models/optional"
import DissolutionSession from "app/models/session/dissolutionSession.model"

@provide(SessionService)
export default class SessionService {

    public clearDissolutionSession(req: Request): void {
        req.session!.setExtraData(DISSOLUTION_SESSION_KEY, undefined)
    }

    public getAccessToken(req: Request): string {
        return this.getSignInInfo(req).access_token!.access_token!
    }

    public getUserEmail(req: Request): Optional<string> {
        return this.getSignInInfo(req)?.user_profile?.email!
    }

    public getDissolutionSession(req: Request): Optional<DissolutionSession> {
        return req.session!.getExtraData<DissolutionSession>(DISSOLUTION_SESSION_KEY)
    }

    public requireDissolutionSession(req: Request): DissolutionSession {
        const dissolutionSession = this.getDissolutionSession(req)
        if (!dissolutionSession) {
            throw new Error("No dissolution session in request")
        }
        return dissolutionSession
    }

    public getJourneyId(req: Request): Optional<string> {
        return this.getDissolutionSession(req)?.journeyId
    }

    public requireJourneyId(req: Request): string {
        const journeyId = this.getJourneyId(req)
        if (!journeyId) {
            throw new Error("No journeyId in session")
        }
        return journeyId
    }

    public setDissolutionSession(req: Request, updatedSession: DissolutionSession): void {
        req.session!.setExtraData(DISSOLUTION_SESSION_KEY, updatedSession)
    }

    public updateRemindDirectorList(req: Request, signatoryId: string, reminderSent: boolean): void {
        const session = this.requireDissolutionSession(req)

        const filteredList = (session.remindDirectorList || []).filter(r => r.id !== signatoryId)

        const updatedSession: DissolutionSession = {
            ...session,
            remindDirectorList: [
                ...filteredList,
                { id: signatoryId, reminderSent }
            ]
        }

        this.setDissolutionSession(req, updatedSession)
    }

    public requireDissolutionCompanyNumber(req: Request): string {
        const companyNumber = this.getDissolutionSession(req)?.companyNumber
        if (!companyNumber) {
            throw new Error("No company number in dissolution session")
        }
        return companyNumber
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
