import { inject } from "inversify"
import { controller, httpGet } from "inversify-express-utils"

import BaseController from "app/controllers/base.controller"
import ViewApplicationStatusMapper from "app/mappers/view-application-status/viewApplicationStatus.mapper"
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse"
import Optional from "app/models/optional"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import { ViewApplicationStatus } from "app/models/view/viewApplicationStatus.model"
import { NOT_SELECTED_SIGNATORY } from "app/paths"
import DissolutionService from "app/services/dissolution/dissolution.service"
import SessionService from "app/services/session/session.service"

interface ViewModel {
  viewApplicationStatus: ViewApplicationStatus
}

@controller(NOT_SELECTED_SIGNATORY)
export class NotSelectedSignatoryController extends BaseController {

    public constructor (
    @inject(SessionService) private session: SessionService,
    @inject(DissolutionService) private dissolutionService: DissolutionService,
    @inject(ViewApplicationStatusMapper) private viewApplicationStatusMapper: ViewApplicationStatusMapper
    ) {
        super()
    }

    @httpGet('')
    public async get (): Promise<string> {
        const token: string = this.session.getAccessToken(this.httpContext.request)
        const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

        const dissolution: Optional<DissolutionGetResponse> = await this.dissolutionService.getDissolution(token, dissolutionSession)

        return this.renderView(dissolution!)
    }

    private async renderView (dissolution: DissolutionGetResponse): Promise<string> {
        const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!
        const viewApplicationStatus: ViewApplicationStatus = this.viewApplicationStatusMapper.mapToViewModel(dissolutionSession,
            dissolution, false)

        const viewModel: ViewModel = {
            viewApplicationStatus
        }

        return super.render("not-selected-signatory", viewModel)
    }
}
