import { inject } from 'inversify'
import { controller, httpGet, httpPost } from 'inversify-express-utils'
import BaseController from './base.controller'

import CompanyDetails from 'app/models/companyDetails.model'
import OfficerType from 'app/models/dto/officerType.enum'
import ClosableCompanyType from 'app/models/mapper/closableCompanyType.enum'
import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { REDIRECT_GATE_URI, VIEW_COMPANY_INFORMATION_URI } from 'app/paths'
import CompanyService from 'app/services/company/company.service'
import SessionService from 'app/services/session/session.service'

interface ViewModel {
  company: CompanyDetails
  error: Optional<string>
}

@controller(VIEW_COMPANY_INFORMATION_URI)
export class ViewCompanyInformationController extends BaseController {

  public constructor(
    @inject(SessionService) private session: SessionService,
    @inject(CompanyService) private companyService: CompanyService) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!
    const token: string = this.session.getAccessToken(this.httpContext.request)

    const company: CompanyDetails = await this.getCompanyInfo(token, session)

    const error: Optional<string> = await this.validateCompanyDetails(token, company)

    this.updateSession(session, company)

    const viewModel: ViewModel = {
      company,
      error
    }
    return super.render('view-company-information', viewModel)
  }

  @httpPost('')
  public post(): void {
    this.httpContext.response.redirect(REDIRECT_GATE_URI)
  }

  private async getCompanyInfo(token: string, session: DissolutionSession): Promise<CompanyDetails> {
    const companyNumber: string = session.companyNumber!

    return this.companyService.getCompanyDetails(token, companyNumber)
  }

  private async validateCompanyDetails(token: string, companyDetails: CompanyDetails): Promise<Optional<string>> {
    return this.companyService.validateCompanyDetails(companyDetails, token)
  }

  private updateSession(session: DissolutionSession, company: CompanyDetails): void {
    const updatedSession: DissolutionSession = {
      ...session,
      officerType: company.companyType === ClosableCompanyType.LLP ? OfficerType.MEMBER : OfficerType.DIRECTOR
    }
    this.session.setDissolutionSession(this.httpContext.request, updatedSession)
  }
}
