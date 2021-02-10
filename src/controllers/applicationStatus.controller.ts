import { inject } from 'inversify'
import { controller, httpGet, requestParam } from 'inversify-express-utils'
import { RedirectResult } from 'inversify-express-utils/dts/results'

import BaseController from 'app/controllers/base.controller'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { APPLICATION_STATUS_URI, CHANGE_DETAILS_URI, WAIT_FOR_OTHERS_TO_SIGN_URI } from 'app/paths'
import SessionService from 'app/services/session/session.service'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import ViewApplicationStatusMapper from 'app/mappers/view-application-status/viewApplicationStatus.mapper'
import Optional from 'app/models/optional'

@controller(APPLICATION_STATUS_URI)
export class ApplicationStatusController extends BaseController {

  public constructor(
    @inject(SessionService) private session: SessionService,
    @inject(DissolutionService) private dissolutionService: DissolutionService,
    @inject(ViewApplicationStatusMapper) private viewApplicationStatusMapper: ViewApplicationStatusMapper
    ) {
    super()
  }

  @httpGet('/:signatoryId/change')
  public async change(@requestParam('signatoryId') signatoryId: string): Promise<RedirectResult> {
    const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

    dissolutionSession.signatoryIdToEdit = signatoryId

    this.session.setDissolutionSession(this.httpContext.request, dissolutionSession)

    return super.redirect(CHANGE_DETAILS_URI)
  }

  @httpGet('/:signatoryEmail/send-email')
  public async resend(@requestParam('signatoryEmail') signatoryEmail: string): Promise<RedirectResult>{
    const token: string = this.session.getAccessToken(this.httpContext.request)
    const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!
    const dissolution: Optional<DissolutionGetResponse> = await this.dissolutionService.getDissolution(token, dissolutionSession)

    const reminderSent: boolean = await this.dissolutionService.sendEmailNotification(dissolutionSession.companyNumber!, signatoryEmail)

    this.viewApplicationStatusMapper.mapToViewModel(dissolutionSession, dissolution!, true).signatories.forEach(signatory => {
      if (signatory.email === signatoryEmail) {
        const id: string = signatory.id
        console.log(dissolutionSession.remindDirectorList)
        if (dissolutionSession.remindDirectorList === undefined){
          dissolutionSession.remindDirectorList = new Array()
        }
        dissolutionSession.remindDirectorList!.push({id, reminderSent})
      }
    })

    this.session.setDissolutionSession(this.httpContext.request, dissolutionSession)

    return super.redirect(WAIT_FOR_OTHERS_TO_SIGN_URI)
  }

}
