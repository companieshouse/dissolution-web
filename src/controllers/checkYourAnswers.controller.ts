import { inject } from 'inversify'
import { controller, httpGet, httpPost } from 'inversify-express-utils'
import { RedirectResult } from 'inversify-express-utils/dts/results'

import BaseController from 'app/controllers/base.controller'
import CheckYourAnswersDirectorMapper from 'app/mappers/check-your-answers/checkYourAnswersDirector.mapper'
import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import CheckYourAnswersDirector from 'app/models/view/checkYourAnswersDirector.model'
import { CHECK_YOUR_ANSWERS_URI, REDIRECT_GATE_URI } from 'app/paths'
import { DissolutionService } from 'app/services/dissolution/dissolution.service'
import SessionService from 'app/services/session/session.service'
import TYPES from 'app/types'

interface ViewModel {
  directors?: CheckYourAnswersDirector[]
}

@controller(CHECK_YOUR_ANSWERS_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware, TYPES.CompanyAuthMiddleware)
export class CheckYourAnswersController extends BaseController {
  public constructor(
    @inject(DissolutionService) private dissolutionService: DissolutionService,
    @inject(SessionService) private session: SessionService,
    @inject(CheckYourAnswersDirectorMapper) private mapper: CheckYourAnswersDirectorMapper) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    const viewModel: ViewModel = {
      directors: this.getDirectors()
    }
    return super.render('check-your-answers', viewModel)
  }

  @httpPost('')
  public async post(): Promise<RedirectResult> {
    const token: string = this.session.getAccessToken(this.httpContext.request)
    const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

    const applicationReferenceNumber: Optional<string> = await this.dissolutionService.createDissolution(token, dissolutionSession)

    this.updateSession(applicationReferenceNumber!)

    return this.redirect(REDIRECT_GATE_URI)
  }

  private updateSession(applicationReferenceNumber: string): void {
    const updatedSession: DissolutionSession = {
      ...this.session.getDissolutionSession(this.httpContext.request),
      applicationReferenceNumber
    }

    this.session.setDissolutionSession(this.httpContext.request, updatedSession)
  }

  private getDirectors(): CheckYourAnswersDirector[] {
    const directorsToSign = this.session.getDissolutionSession(this.httpContext.request)!.directorsToSign
    return directorsToSign!.map(director => this.mapper.mapToCheckYourAnswersDirector(director))
  }
}
