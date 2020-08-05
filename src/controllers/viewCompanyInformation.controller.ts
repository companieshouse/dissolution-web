import { inject } from 'inversify'
import { controller, httpGet, httpPost } from 'inversify-express-utils'
import BaseController from './base.controller'

import CompanyDetails from 'app/models/companyDetails.model'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { REDIRECT_GATE_URI, VIEW_COMPANY_INFORMATION_URI } from 'app/paths'
import CompanyService from 'app/services/company/company.service'
import SessionService from 'app/services/session/session.service'
import TYPES from 'app/types'

interface ViewModel {
  company: CompanyDetails
}

@controller(VIEW_COMPANY_INFORMATION_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware)
export class ViewCompanyInformationController extends BaseController {

  public constructor(
    @inject(SessionService) private session: SessionService,
    @inject(CompanyService) private companyService: CompanyService) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!
    const company: CompanyDetails = await this.getCompanyInfo()

    this.updateSession(session, company)

    const viewModel: ViewModel = {
      company
    }
    return super.render('view-company-information', viewModel)
  }

  @httpPost('')
  public post(): void {
    this.httpContext.response.redirect(REDIRECT_GATE_URI)
  }

  private async getCompanyInfo(): Promise<CompanyDetails> {
    const companyNumber: string = this.getCompanyNumber()
    const token: string = this.session.getAccessToken(this.httpContext.request)
    return this.companyService.getCompanyDetails(token, companyNumber)
  }

  private getCompanyNumber(): string {
    return this.session.getDissolutionSession(this.httpContext.request)!.companyNumber!
  }

  private updateSession(session: DissolutionSession, company: CompanyDetails): void {
    const updatedSession: DissolutionSession = {
      ...session,
      companyType: company.companyType
    }
    this.session.setDissolutionSession(this.httpContext.request, updatedSession)
  }
}
