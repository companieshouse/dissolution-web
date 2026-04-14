import "reflect-metadata"

import {assert} from "chai"
import {Application, Request} from "express"
import {StatusCodes} from "http-status-codes"
import request from "supertest"
import {anything, capture, instance, mock, verify, when} from "ts-mockito"
import {ArgCaptor2} from "ts-mockito/lib/capture/ArgCaptor"
import {generateDissolutionSession} from "../fixtures/session.fixtures"
import {createApp} from "./helpers/application.factory"

import "app/controllers/applicationStatus.controller"
import ViewApplicationStatusMapper from "app/mappers/view-application-status/viewApplicationStatus.mapper"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import {APPLICATION_STATUS_URI, CHANGE_DETAILS_URI, WAIT_FOR_OTHERS_TO_SIGN_URI} from "app/paths"
import DissolutionService from "app/services/dissolution/dissolution.service"
import SessionService from "app/services/session/session.service"
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock"
import {aDissolutionSession} from "test/fixtures/dissolutionSession.builder";
import {aDissolutionGetResponse} from "test/fixtures/dissolutionGetResponse.builder";
import {aDissolutionGetDirector} from "test/fixtures/dissolutionGetDirector.builder";

mockCsrfMiddleware.restore()

describe("ApplicationStatusController", () => {

    let sessionService: SessionService
    let dissolutionService: DissolutionService
    let dissolutionSession: DissolutionSession
    let app: Application

    beforeEach(() => {
        sessionService = mock(SessionService)
        dissolutionService = mock(DissolutionService)
        dissolutionSession = generateDissolutionSession()
        app = createApp(container => {
            container.rebind(SessionService).toConstantValue(instance(sessionService))
            container.rebind(DissolutionService).toConstantValue(instance(dissolutionService))
            container.rebind(ViewApplicationStatusMapper).toConstantValue(new ViewApplicationStatusMapper())
        })
    })

    describe("Change", () => {
        it("should save the signatory ID in session and redirect to change details", async () => {
            const signatoryId: string = "abc123"

            dissolutionSession.signatoryIdToEdit = undefined

            when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession)

            await request(app)
                .get(`${APPLICATION_STATUS_URI}/${signatoryId}/change`)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", CHANGE_DETAILS_URI)

            verify(sessionService.setDissolutionSession(anything(), anything())).once()

            const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(sessionService.setDissolutionSession)
            const updatedSession: DissolutionSession = sessionCaptor.last()[1]

            assert.equal(updatedSession.signatoryIdToEdit, signatoryId)
            assert.isFalse(updatedSession.isFromCheckAnswers)
        })

        it("should save the signatory ID and checkAnswers in session and redirect to change details", async () => {
            const signatoryId: string = "abc123"

            dissolutionSession.signatoryIdToEdit = undefined
            dissolutionSession.isFromCheckAnswers = undefined

            when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession)

            await request(app)
                .get(`${APPLICATION_STATUS_URI}/${signatoryId}/change?check_answers=true`)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", CHANGE_DETAILS_URI)

            verify(sessionService.setDissolutionSession(anything(), anything())).once()

            const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(sessionService.setDissolutionSession)
            const updatedSession: DissolutionSession = sessionCaptor.last()[1]

            assert.equal(updatedSession.signatoryIdToEdit, signatoryId)
            assert.isTrue(updatedSession.isFromCheckAnswers)
        })
    })

    describe("Send-email", () => {
        it("Should save the email reminder status in the session and redirect to send-email", async () => {

            const companyNumber = "12345678"
            const email = "test@mail.com"
            const signatoryId = "test-signatory-id"
            const dissolutionSession = aDissolutionSession().withCompanyNumber(companyNumber).build()
            const dissolutionGetResponse = aDissolutionGetResponse()
                .withDirector(aDissolutionGetDirector().withOfficerId(signatoryId).withEmail(email)).build()

            when(sessionService.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(dissolutionService.getDissolution(anything(), dissolutionSession)).thenResolve(dissolutionGetResponse)
            when(dissolutionService.sendEmailNotification(companyNumber, email)).thenResolve(true)

            await request(app)
                .get(`${APPLICATION_STATUS_URI}/${signatoryId}/send-email`)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", WAIT_FOR_OTHERS_TO_SIGN_URI)

            assert.equal(dissolutionSession.remindDirectorList.length, 1)
            assert.equal(dissolutionSession.remindDirectorList[0].id, signatoryId)
            assert.equal(dissolutionSession.remindDirectorList[0].reminderSent, true)
        })
    })
})
