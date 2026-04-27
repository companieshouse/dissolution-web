import { SessionKey } from "@companieshouse/node-session-handler/lib/session/keys/SessionKey"
import { ISignInInfo } from "@companieshouse/node-session-handler/lib/session/model/SessionInterfaces"
import { assert } from "chai"
import { Request } from "express"
import sinon from "sinon"
import { generateRequest } from "test/fixtures/http.fixtures"
import { generateDissolutionSession, generateISignInInfo, TOKEN } from "test/fixtures/session.fixtures"

import Optional from "app/models/optional"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import SessionService from "app/services/session/session.service"
import {aDissolutionSession} from "test/fixtures/dissolutionSession.builder";

describe("SessionService", () => {

    let service: SessionService

    let getSessionStub: sinon.SinonStub

    beforeEach(() => {
        service = new SessionService()

        getSessionStub = sinon.stub()
    })

    describe("getAccessToken", () => {
        it("should retrieve the access token from the session", () => {
            const signInInfo: ISignInInfo = generateISignInInfo()
      signInInfo.access_token!.access_token = TOKEN

      const req: Request = generateRequest()
      req.session!.get = getSessionStub.withArgs(SessionKey.SignInInfo).returns(signInInfo)

      const result: string = service.getAccessToken(req)

      assert.equal(result, TOKEN)
        })
    })

    describe("getUserEmail", () => {
        const EMAIL = "some@mail.com"

        it(`should retrieve the logged in users email from the session`, () => {
            const signInInfo: ISignInInfo = generateISignInInfo()
      signInInfo.user_profile!.email = EMAIL

      const req: Request = generateRequest()
      req.session!.get = getSessionStub.withArgs(SessionKey.SignInInfo).returns(signInInfo)

      const result: Optional<string> = service.getUserEmail(req)

      assert.equal(result, EMAIL)
        })

        it(`should return undefined if there is no sign in info present in the session`, () => {
            const req: Request = generateRequest()
      req.session!.get = getSessionStub.withArgs(SessionKey.SignInInfo).returns(undefined)

      const result: Optional<string> = service.getUserEmail(req)

      assert.isUndefined(result)
        })
    })

    describe("getDissolutionSession", () => {
        it("should retrieve the dissolution object from the session", () => {
            const dissolutionSession: DissolutionSession = generateDissolutionSession()

            const req: Request = generateRequest()
      req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(dissolutionSession)

      const result: Optional<DissolutionSession> = service.getDissolutionSession(req)

      assert.equal(result, dissolutionSession)
        })
    })

    describe("requireDissolutionSession", () => {
        it("should return the dissolution session when present", () => {
            const dissolutionSession = aDissolutionSession().build()

            const req: Request = generateRequest()
            req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(dissolutionSession)

            const result: DissolutionSession = service.requireDissolutionSession(req)

            assert.equal(result, dissolutionSession)
        })

        it("should throw an Error when there is no dissolution session", () => {
            const req: Request = generateRequest()
            req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(undefined)

            assert.throws(() => service.requireDissolutionSession(req), Error, "No dissolution session in request")
        })
    })

    describe("requireJourneyId", () => {
        it("should return the journeyId when present", () => {
            const journeyId = "journey-123"
            const dissolutionSession = aDissolutionSession().withJourneyId(journeyId).build()

            const req: Request = generateRequest()
            req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(dissolutionSession)

            const result: string = service.requireJourneyId(req)

            assert.equal(result, journeyId)
        })

        it("should throw an Error when there is no journeyId", () => {
            // Create a session object without a journeyId (or with a falsy journeyId)
            const dissolutionSession: any = generateDissolutionSession()
            dissolutionSession.journeyId = undefined

            const req: Request = generateRequest()
            req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(dissolutionSession)

            assert.throws(() => service.requireJourneyId(req), Error, "No journeyId in session")
        })
    })

    describe("setDissolutionSession", () => {
        it("should set the dissolution object in the session", () => {
            const dissolutionSession: DissolutionSession = generateDissolutionSession()

            const req: Request = generateRequest()

            const setExtraDataStub: sinon.SinonStub = sinon.stub()
      req.session!.setExtraData = setExtraDataStub

      service.setDissolutionSession(req, dissolutionSession)

      assert.isTrue(setExtraDataStub.withArgs("dissolution", dissolutionSession).called)
        })
    })

    describe("clearDissolutionSession", () => {
        it("should clear the dissolution object in the session", () => {
            const req: Request = generateRequest()
            const setExtraDataStub: sinon.SinonStub = sinon.stub()
            req.session!.setExtraData = setExtraDataStub

            service.clearDissolutionSession(req)

            assert.isTrue(setExtraDataStub.withArgs("dissolution", undefined).called)
        })
    })
})
