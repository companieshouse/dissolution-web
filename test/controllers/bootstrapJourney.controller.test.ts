import "reflect-metadata"
import { anything, instance, mock, when, verify, capture } from "ts-mockito"
import { assert } from "chai"
import { Request } from "express"
import { BootstrapJourneyController } from "app/controllers/bootstrapJourney.controller"
import SessionService from "app/services/session/session.service"
import UuidGenerator from "app/utils/uuidGenerator"
import { VIEW_COMPANY_INFORMATION_URI } from "app/paths"
import JourneyPathService from "app/services/session/journeyPath.service";

function generateMockContext() {
    return {
        request: {} as Request,
        response: { redirect: (url: string) => url } as any
    }
}

describe("BootstrapJourneyController", () => {
    let sessionServiceMock: SessionService
    let sessionService: SessionService
    let journeyPathService: JourneyPathService
    let uuidGeneratorMock: UuidGenerator
    let uuidGenerator: UuidGenerator
    let controller: BootstrapJourneyController
    let httpContext: any

    beforeEach(() => {
        sessionServiceMock = mock(SessionService)
        sessionService = instance(sessionServiceMock)
        journeyPathService = new JourneyPathService(sessionService)

        uuidGeneratorMock = mock(UuidGenerator)
        uuidGenerator = instance(uuidGeneratorMock)
        controller = new BootstrapJourneyController(journeyPathService, sessionService, uuidGenerator)
        httpContext = generateMockContext()
        // @ts-ignore
        controller.httpContext = httpContext
    })

    it("initializes dissolution session and redirects to view company information", async () => {
        const companyNumber = "12345678"
        const journeyId = "e1101f0a-5121-4429-acee-a817c5cAAAAA"
        let redirectedUrl = ""

        when(uuidGeneratorMock.generate()).thenReturn(journeyId)

        httpContext.response.redirect = (url: string) => { redirectedUrl = url }
        // @ts-ignore
        controller.redirect = (url: string) => httpContext.response.redirect(url)

        await controller.get(companyNumber)

        verify(sessionServiceMock.setDissolutionSession(httpContext.request, anything())).once()
        assert.equal(
            redirectedUrl,
            VIEW_COMPANY_INFORMATION_URI.replace(":journeyId", journeyId),
            "Should redirect to correct path with journeyId"
        )
        const [, savedSession] = capture(sessionServiceMock.setDissolutionSession).last()
        assert.isDefined(savedSession)
        assert.equal(savedSession.companyNumber, companyNumber)
        assert.equal(savedSession.journeyId, journeyId)
        assert.deepEqual(savedSession.remindDirectorList, [])
    })
})
