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
import {aDissolutionSession} from "test/fixtures/dissolutionSession.builder"

describe("SessionService", () => {

    let sessionService: SessionService

    let getSessionStub: sinon.SinonStub

    beforeEach(() => {
        sessionService = new SessionService()

        getSessionStub = sinon.stub()
    })

    describe("getAccessToken", () => {
        it("should retrieve the access token from the session", () => {
            const signInInfo: ISignInInfo = generateISignInInfo()
      signInInfo.access_token!.access_token = TOKEN

      const req: Request = generateRequest()
      req.session!.get = getSessionStub.withArgs(SessionKey.SignInInfo).returns(signInInfo)

      const result: string = sessionService.getAccessToken(req)

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

      const result: Optional<string> = sessionService.getUserEmail(req)

      assert.equal(result, EMAIL)
        })

        it(`should return undefined if there is no sign in info present in the session`, () => {
            const req: Request = generateRequest()
      req.session!.get = getSessionStub.withArgs(SessionKey.SignInInfo).returns(undefined)

      const result: Optional<string> = sessionService.getUserEmail(req)

      assert.isUndefined(result)
        })
    })

    describe("getDissolutionSession", () => {
        it("should retrieve the dissolution object from the session", () => {
            const dissolutionSession: DissolutionSession = generateDissolutionSession()

            const req: Request = generateRequest()
      req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(dissolutionSession)

      const result: Optional<DissolutionSession> = sessionService.getDissolutionSession(req)

      assert.equal(result, dissolutionSession)
        })
    })

    describe("requireDissolutionSession", () => {
        it("should return the dissolution session when present", () => {
            const dissolutionSession = aDissolutionSession().build()

            const req: Request = generateRequest()
            req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(dissolutionSession)

            const result: DissolutionSession = sessionService.requireDissolutionSession(req)

            assert.equal(result, dissolutionSession)
        })

        it("should throw an Error when there is no dissolution session", () => {
            const req: Request = generateRequest()
            req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(undefined)

            assert.throws(() => sessionService.requireDissolutionSession(req), Error, "No dissolution session in request")
        })
    })

    describe("requireJourneyId", () => {
        it("should return the journeyId when present", () => {
            const journeyId = "journey-123"
            const dissolutionSession = aDissolutionSession().withJourneyId(journeyId).build()

            const req: Request = generateRequest()
            req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(dissolutionSession)

            const result: string = sessionService.requireJourneyId(req)

            assert.equal(result, journeyId)
        })

        it("should throw an Error when there is no journeyId", () => {
            // Create a session object without a journeyId (or with a falsy journeyId)
            const dissolutionSession: any = generateDissolutionSession()
            dissolutionSession.journeyId = undefined

            const req: Request = generateRequest()
            req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(dissolutionSession)

            assert.throws(() => sessionService.requireJourneyId(req), Error, "No journeyId in session")
        })
    })

    describe("getDissolutionCompanyNumber", () => {
        it("should return the company number when present", () => {
            const companyNumber = "COMP-123"
            const dissolutionSession = aDissolutionSession().withCompanyNumber(companyNumber).build()

            const req: Request = generateRequest()
            req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(dissolutionSession)

            const result: Optional<string> = sessionService.getDissolutionCompanyNumber(req)

            assert.equal(result, companyNumber)
        })

        it("should return undefined when there is no company number", () => {
            const req: Request = generateRequest()
            req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(undefined)

            const result: Optional<string> = sessionService.getDissolutionCompanyNumber(req)

            assert.isUndefined(result)
        })
    })

    describe("requireDissolutionCompanyNumber", () => {
        it("should return the company number when present", () => {
            const companyNumber = "COMP-123"
            const dissolutionSession = aDissolutionSession().withCompanyNumber(companyNumber).build()

            const req: Request = generateRequest()
            req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(dissolutionSession)

            const result: string = sessionService.requireDissolutionCompanyNumber(req)

            assert.equal(result, companyNumber)
        })

        it("should throw an Error when there is no company number", () => {
            const dissolutionSession: any = generateDissolutionSession()
            dissolutionSession.companyNumber = undefined

            const req: Request = generateRequest()
            req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(dissolutionSession)

            assert.throws(() => sessionService.requireDissolutionCompanyNumber(req), Error, "No company number in dissolution session")
        })
    })

    describe("setDissolutionSession", () => {
        it("should set the dissolution object in the session", () => {
            const dissolutionSession: DissolutionSession = generateDissolutionSession()

            const req: Request = generateRequest()

            const setExtraDataStub: sinon.SinonStub = sinon.stub()
      req.session!.setExtraData = setExtraDataStub

      sessionService.setDissolutionSession(req, dissolutionSession)

      assert.isTrue(setExtraDataStub.withArgs("dissolution", dissolutionSession).called)
        })
    })

    describe("clearDissolutionSession", () => {
        it("should clear the dissolution object in the session", () => {
            const req: Request = generateRequest()
            const setExtraDataStub: sinon.SinonStub = sinon.stub()
            req.session!.setExtraData = setExtraDataStub

            sessionService.clearDissolutionSession(req)

            assert.isTrue(setExtraDataStub.withArgs("dissolution", undefined).called)
        })
    })

    describe("updateRemindDirectorList", () => {
        it("should add a new remind entry when none exist", () => {
            const dissolutionSession = aDissolutionSession().withRemindDirectorList(undefined).build()

            const req: Request = generateRequest()
            req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(dissolutionSession)

            const setExtraDataStub: sinon.SinonStub = sinon.stub()
            req.session!.setExtraData = setExtraDataStub

            sessionService.updateRemindDirectorList(req, "sign-1", true)

            assert.isTrue(setExtraDataStub.calledOnce)
            const updated: DissolutionSession = setExtraDataStub.getCall(0).args[1]
            assert.deepEqual(updated.remindDirectorList, [{ id: "sign-1", reminderSent: true }])
        })

        it("should replace existing entry for the same signatoryId", () => {
            const dissolutionSession = aDissolutionSession().withRemindDirectorList([{ id: "sign-1", reminderSent: false }]).build()

            const req: Request = generateRequest()
            req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(dissolutionSession)

            const setExtraDataStub: sinon.SinonStub = sinon.stub()
            req.session!.setExtraData = setExtraDataStub

            sessionService.updateRemindDirectorList(req, "sign-1", true)

            assert.isTrue(setExtraDataStub.calledOnce)
            const updated: DissolutionSession = setExtraDataStub.getCall(0).args[1]
            assert.deepEqual(updated.remindDirectorList, [{ id: "sign-1", reminderSent: true }])
        })

        it("should preserve other entries and append the new entry at the end", () => {
            const initialList = [
                { id: "other-1", reminderSent: true },
                { id: "sign-1", reminderSent: false },
                { id: "other-2", reminderSent: false }
            ]

            const dissolutionSession = aDissolutionSession().withRemindDirectorList(initialList).build()

            const req: Request = generateRequest()
            req.session!.getExtraData = getSessionStub.withArgs("dissolution").returns(dissolutionSession)

            const setExtraDataStub: sinon.SinonStub = sinon.stub()
            req.session!.setExtraData = setExtraDataStub

            sessionService.updateRemindDirectorList(req, "sign-1", true)

            assert.isTrue(setExtraDataStub.calledOnce)
            const updated: DissolutionSession = setExtraDataStub.getCall(0).args[1]
            assert.deepEqual(updated.remindDirectorList, [
                { id: "other-1", reminderSent: true },
                { id: "other-2", reminderSent: false },
                { id: "sign-1", reminderSent: true }
            ])
        })
    })

    describe("initDissolutionSession", () => {
        it("should create and set a minimal dissolution session with journeyId and companyNumber", () => {
            const req: Request = generateRequest()

            const setExtraDataStub: sinon.SinonStub = sinon.stub()
            req.session!.setExtraData = setExtraDataStub

            const journeyId = "journey-123"
            const companyNumber = "COMP-123"

            sessionService.initDissolutionSession(req, journeyId, companyNumber)

            assert.isTrue(setExtraDataStub.calledOnce)
            const callArgs = setExtraDataStub.getCall(0).args
            assert.equal(callArgs[0], "dissolution")
            const savedSession: any = callArgs[1]

            assert.deepEqual(Object.keys(savedSession).sort(), ["companyNumber", "journeyId"])
            assert.equal(savedSession.journeyId, journeyId)
            assert.equal(savedSession.companyNumber, companyNumber)
        })
    })
})
