import {inject} from "inversify"
import {controller, httpGet, queryParam} from "inversify-express-utils"
import SessionService from "app/services/session/session.service"
import UuidGenerator from "app/utils/uuidGenerator"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import TYPES from "app/types"
import {BOOTSTRAP_JOURNEY_URI, VIEW_COMPANY_INFORMATION_URI} from "app/paths"
import JourneyBaseController from "app/controllers/JourneyBase.controller";
import JourneyPathService from "app/services/session/journeyPath.service";
import {RedirectResult} from "inversify-express-utils/lib/results";

@controller(BOOTSTRAP_JOURNEY_URI)
export class BootstrapJourneyController extends JourneyBaseController {
    public constructor(
        @inject(JourneyPathService) readonly journeyPathService: JourneyPathService,
        @inject(SessionService) private readonly sessionService: SessionService,
        @inject(TYPES.UuidGenerator) private readonly uuidGenerator: UuidGenerator
    ) {
        super(journeyPathService)
    }

    @httpGet("")
    public async get(@queryParam("companyNumber") companyNumber: string): Promise<string | RedirectResult> {
        const journeyId = this.uuidGenerator.generate()
        this.initDissolutionSession(journeyId, companyNumber)
        return this.redirect(this.journeyPath(VIEW_COMPANY_INFORMATION_URI, {journeyId}))
    }

    private initDissolutionSession(journeyId: string, companyNumber: string): void {
        const req = this.httpContext.request

        const session: DissolutionSession = {
            journeyId,
            companyNumber,
            remindDirectorList: []
        }
        this.sessionService.setDissolutionSession(req, session)
    }
}
