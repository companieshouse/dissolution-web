import "reflect-metadata"

import { Application } from "express"
import { StatusCodes } from "http-status-codes"
import request from "supertest"
import { anything, instance, mock, verify, when } from "ts-mockito"
import { generateDissolutionConfirmation, generateDissolutionSession } from "../fixtures/session.fixtures"
import { createApp } from "./helpers/application.factory"

import "app/controllers/certificateDownload.controller"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import { CERTIFICATE_DOWNLOAD_URI } from "app/paths"
import DissolutionService from "app/services/dissolution/dissolution.service"
import SessionService from "app/services/session/session.service"
import mockCsrfMiddleware from "test/__mocks__/csrfProtectionMiddleware.mock"

mockCsrfMiddleware.restore()

describe("CertificateDownloadController", () => {

    let session: SessionService
    let dissolutionService: DissolutionService

    const REDIRECT_URL = "http://some-certificate-download-url"

    before(() => {
        session = mock(SessionService)
        dissolutionService = mock(DissolutionService)
    })

    describe("GET", () => {
        it("should generate a URL to download the certificate and redirect to it", async () => {
            const dissolutionSession: DissolutionSession = generateDissolutionSession()
            dissolutionSession.confirmation = generateDissolutionConfirmation()

            when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
            when(dissolutionService.generateDissolutionCertificateUrl(dissolutionSession.confirmation)).thenResolve(REDIRECT_URL)

            const app: Application = createApp(container => {
                container.rebind(SessionService).toConstantValue(instance(session))
                container.rebind(DissolutionService).toConstantValue(instance(dissolutionService))
            })

            await request(app)
                .get(CERTIFICATE_DOWNLOAD_URI)
                .expect(StatusCodes.MOVED_TEMPORARILY)
                .expect("Location", REDIRECT_URL)

            verify(dissolutionService.generateDissolutionCertificateUrl(dissolutionSession.confirmation)).once()
        })
    })
})
