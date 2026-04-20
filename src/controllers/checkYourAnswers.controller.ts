import {inject} from "inversify"
import {controller, httpGet, httpPost} from "inversify-express-utils"
import {RedirectResult} from "inversify-express-utils/lib/results"
import CheckYourAnswersDirectorMapper from "app/mappers/check-your-answers/checkYourAnswersDirector.mapper"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import CheckYourAnswersDirector from "app/models/view/checkYourAnswersDirector.model"
import {CHECK_YOUR_ANSWERS_URI, DEFINE_SIGNATORY_INFO_URI, REDIRECT_GATE_URI, SELECT_DIRECTOR_URI} from "app/paths"
import DissolutionService from "app/services/dissolution/dissolution.service"
import SessionService from "app/services/session/session.service"
import TYPES from "app/types";
import JourneyBaseController from "app/controllers/JourneyBase.controller";
import JourneyPathService from "app/services/session/journeyPath.service";

interface ViewModel {
  backUri: string
  directors?: CheckYourAnswersDirector[]
    isMultiDirector?: boolean
}

@controller(CHECK_YOUR_ANSWERS_URI, TYPES.JourneyIdAuthMiddleware)
export class CheckYourAnswersController extends JourneyBaseController {

    public constructor (
    @inject(DissolutionService) private readonly dissolutionService: DissolutionService,
    @inject(SessionService) private readonly session: SessionService,
    @inject(CheckYourAnswersDirectorMapper) private readonly mapper: CheckYourAnswersDirectorMapper,
    @inject(JourneyPathService) readonly journeyPathService: JourneyPathService) {
        super(journeyPathService)
    }

    @httpGet("")
    public async get (): Promise<string> {
        const viewModel: ViewModel = {
            backUri: this.getBackLink(),
            directors: this.getDirectors(),
            isMultiDirector: this.session.getDissolutionSession(this.httpContext.request)!.isMultiDirector
        }
        return super.render("check-your-answers", viewModel)
    }

    private getBackLink (): string {
        const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

        return session.isApplicantADirector && !session.isMultiDirector ? SELECT_DIRECTOR_URI : DEFINE_SIGNATORY_INFO_URI
    }

    @httpPost("")
    public async post (): Promise<RedirectResult> {
        const token: string = this.session.getAccessToken(this.httpContext.request)
        const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!
        delete dissolutionSession.isFromCheckAnswers
        this.session.setDissolutionSession(this.httpContext.request, dissolutionSession)
        await this.dissolutionService.createDissolution(token, dissolutionSession)

        return this.redirect(this.journeyPath(REDIRECT_GATE_URI))
    }

    private getDirectors (): CheckYourAnswersDirector[] {
        const directorsToSign = this.session.getDissolutionSession(this.httpContext.request)!.directorsToSign
        return directorsToSign!.map(director => this.mapper.mapToCheckYourAnswersDirector(director))
    }
}
