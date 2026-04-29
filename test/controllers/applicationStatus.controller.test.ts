import "reflect-metadata"

import {assert} from "chai"
import {Application, Request} from "express"
import {StatusCodes} from "http-status-codes"
import request from "supertest"
import {anything, capture, instance, mock, verify, when} from "ts-mockito"
import {ArgCaptor2} from "ts-mockito/lib/capture/ArgCaptor"
import {aDissolutionGetResponse} from "../fixtures/dissolutionGetResponse.builder"
import {aDissolutionSession} from "../fixtures/dissolutionSession.builder"
import {createApp} from "./helpers/application.factory"
import {aDissolutionGetDirector} from "../fixtures/dissolutionGetDirector.builder"

import "app/controllers/applicationStatus.controller"
import ViewApplicationStatusMapper from "app/mappers/view-application-status/viewApplicationStatus.mapper"
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import {ViewApplicationStatus} from "app/models/view/viewApplicationStatus.model"
import {APPLICATION_STATUS_URI, CHANGE_DETAILS_URI, WAIT_FOR_OTHERS_TO_SIGN_URI} from "app/paths"
import DissolutionService from "app/services/dissolution/dissolution.service"
import SessionService from "app/services/session/session.service"
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock"
import JourneyPathService from "app/services/session/journeyPath.service"

mockCsrfMiddleware.restore()

describe("ApplicationStatusController", () => {

    let sessionService: SessionService
    let dissolutionService: DissolutionService
    let dissolutionSession: DissolutionSession
    let viewApplicationStatus: ViewApplicationStatus
    let dissolutionGetResponse: DissolutionGetResponse
    let viewApplicationStatusMapper: ViewApplicationStatusMapper
    let app: Application

    beforeEach(() => {
        sessionService = mock(SessionService)
        dissolutionService = mock(DissolutionService)
        viewApplicationStatusMapper = mock(ViewApplicationStatusMapper)
        dissolutionGetResponse = aDissolutionGetResponse().build()
        dissolutionSession = aDissolutionSession().build()
        app = createApp(container => {
            container.rebind(SessionService).toConstantValue(instance(sessionService))
            container.rebind(DissolutionService).toConstantValue(instance(dissolutionService))
            container.rebind(ViewApplicationStatusMapper).toConstantValue(instance(viewApplicationStatusMapper))
            container.rebind(JourneyPathService).toConstantValue({
                journeyPath: (_req: any, pathTemplate: string) => pathTemplate
            } as any)
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

        const sendEmailCases = [
            { name: "reminder email sent successfully", reminderSent: true },
            { name: "reminder email NOT sent successfully", reminderSent: false }
        ]

        sendEmailCases.forEach(testCase => {
            it(`attempts to send email and records reminder attempt - ${testCase.name}`, async () => { // NOSONAR

                const signatoryId = "valid-signatory-id"
                const signatoryEmail = "signatory@mail.com"

                const dissolutionSession = aDissolutionSession().build()

                when(sessionService.requireDissolutionCompanyNumber(anything())).thenReturn(dissolutionSession.companyNumber!)
                when(dissolutionService.getDissolutionSignatoryEmail(anything(), dissolutionSession.companyNumber!, signatoryId)).thenResolve(signatoryEmail)
                when(dissolutionService.sendEmailNotification(dissolutionSession.companyNumber!, signatoryEmail)).thenResolve(testCase.reminderSent)

                await request(app)
                    .post(`${APPLICATION_STATUS_URI}/send-email`)
                    .send({ signatoryId: signatoryId })
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", WAIT_FOR_OTHERS_TO_SIGN_URI)

                verify(dissolutionService.sendEmailNotification(dissolutionSession.companyNumber!, signatoryEmail)).once()
                verify(sessionService.updateRemindDirectorList(anything(), signatoryId, testCase.reminderSent)).once()
            })
        })

        const validSignatoryIds: Array<any> = [
            { signatoryId: "a" },
            { signatoryId: "A1-9" },
            { signatoryId: "abc-123" },
            { signatoryId: "a".repeat(50) }, // max length
            { signatoryId: "Z9-xyz-987" },
            { signatoryId: "yK7psNr-W-lF68mo2n7fs_q8Gw"}
        ]

        validSignatoryIds.forEach((body) => {
            it(`accepts valid signatory id: ${JSON.stringify(body)}`, async () => { // NOSONAR
                const id = body.signatoryId
                const dissolutionSession = aDissolutionSession().build()
                const signatoryEmail = "signatory@mail.com"

                when(sessionService.requireDissolutionCompanyNumber(anything())).thenReturn(dissolutionSession.companyNumber!)
                when(dissolutionService.getDissolutionSignatoryEmail(anything(), dissolutionSession.companyNumber!, id)).thenResolve(signatoryEmail)
                when(dissolutionService.sendEmailNotification(dissolutionSession.companyNumber!, signatoryEmail)).thenResolve(true)

                await request(app)
                    .post(`${APPLICATION_STATUS_URI}/send-email`)
                    .send(body)
                    .expect(StatusCodes.MOVED_TEMPORARILY)
                    .expect("Location", WAIT_FOR_OTHERS_TO_SIGN_URI)

                verify(dissolutionService.sendEmailNotification(dissolutionSession.companyNumber!, signatoryEmail)).once()
                verify(sessionService.updateRemindDirectorList(anything(), id, true)).once()
            })
        })

        const invalidSignatoryIds: Array<any> = [
            {},
            { signatoryId: " " },
            { signatoryId: "" },
            { signatoryId: "@@@" },
            { signatoryId: "a".repeat(51) }
        ]

        invalidSignatoryIds.forEach((body) => {
            it(`when invalid signatory id then error returned: ${JSON.stringify(body)}`, async () => { // NOSONAR

                await request(app)
                    .post(`${APPLICATION_STATUS_URI}/send-email`)
                    .send(body)
                    .expect(StatusCodes.BAD_REQUEST)

                verify(sessionService.updateRemindDirectorList(anything(), anything(), anything())).never()
                verify(dissolutionService.sendEmailNotification(anything(), anything())).never()
            })
        })

        const noEmailFoundCases = [
            { name: "no directors", dissolution: aDissolutionGetResponse().withDirectors([]).build() },
            { name: "directors present but id not found", dissolution: aDissolutionGetResponse().withDirectors([
                aDissolutionGetDirector().withOfficerId("other-1").build(),
                aDissolutionGetDirector().withOfficerId("other-2").build()
            ]).build() }
        ]

        noEmailFoundCases.forEach(testCase => {
            it(`when no email found for signatoryId then error returned: ${testCase.name}`, async () => { // NOSONAR
                const dissolutionSession = aDissolutionSession().build()

                when(sessionService.requireDissolutionCompanyNumber(anything())).thenReturn(dissolutionSession.companyNumber!)
                when(dissolutionService.getDissolutionSignatoryEmail(anything(), dissolutionSession.companyNumber!, "a-valid-id")).thenResolve(undefined)

                await request(app)
                    .post(`${APPLICATION_STATUS_URI}/send-email`)
                    .send({ signatoryId: "a-valid-id" })
                    .expect(StatusCodes.NOT_FOUND)

                verify(sessionService.updateRemindDirectorList(anything(), anything(), anything())).never()
                verify(dissolutionService.sendEmailNotification(anything(), anything())).never()
            })
        })
    })
})
