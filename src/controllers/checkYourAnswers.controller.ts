import { inject } from "inversify"
import { controller, httpGet, httpPost } from "inversify-express-utils"
import { RedirectResult } from "inversify-express-utils/dts/results"

import BaseController from "app/controllers/base.controller"
import CheckYourAnswersDirectorMapper from "app/mappers/check-your-answers/checkYourAnswersDirector.mapper"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import CheckYourAnswersDirector from "app/models/view/checkYourAnswersDirector.model"
import { CHECK_YOUR_ANSWERS_URI, DEFINE_SIGNATORY_INFO_URI, REDIRECT_GATE_URI, SELECT_DIRECTOR_URI } from "app/paths"
import DissolutionService from "app/services/dissolution/dissolution.service"
import SessionService from "app/services/session/session.service"

interface ViewModel {
  backUri: string
  directors?: CheckYourAnswersDirector[]
}

@controller(CHECK_YOUR_ANSWERS_URI)
export class CheckYourAnswersController extends BaseController {

    public constructor (
    @inject(DissolutionService) private dissolutionService: DissolutionService,
    @inject(SessionService) private session: SessionService,
    @inject(CheckYourAnswersDirectorMapper) private mapper: CheckYourAnswersDirectorMapper) {
        super()
    }

    @httpGet('')
    public async get (): Promise<string> {
        const viewModel: ViewModel = {
            backUri: this.getBackLink(),
            directors: this.getDirectors()
        }
        return super.render("check-your-answers", viewModel)
    }

    private getBackLink (): string {
        const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

        return session.isApplicantADirector && !session.isMultiDirector ? SELECT_DIRECTOR_URI : DEFINE_SIGNATORY_INFO_URI
    }

    @httpPost('')
    public async post (): Promise<RedirectResult> {
        const token: string = this.session.getAccessToken(this.httpContext.request)
        const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

        await this.dissolutionService.createDissolution(token, dissolutionSession)

        return this.redirect(REDIRECT_GATE_URI)
    }

    private getDirectors (): CheckYourAnswersDirector[] {
        const directorsToSign = this.session.getDissolutionSession(this.httpContext.request)!.directorsToSign
        return directorsToSign!.map(director => this.mapper.mapToCheckYourAnswersDirector(director))
    }
}
