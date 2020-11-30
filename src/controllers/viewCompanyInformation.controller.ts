import { inject } from 'inversify'
import { controller, httpGet, httpPost } from 'inversify-express-utils'
import BaseController from './base.controller'

import CompanyDetails from 'app/models/companyDetails.model'
import OfficerType from 'app/models/dto/officerType.enum'
import ClosableCompanyType from 'app/models/mapper/closableCompanyType.enum'
import CompanyStatus from 'app/models/mapper/companyStatus.enum'
import OverseasCompanyPrefix from 'app/models/mapper/overseasCompanyPrefix.enum'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import DirectorDetails from 'app/models/view/directorDetails.model'
import { REDIRECT_GATE_URI, VIEW_COMPANY_INFORMATION_URI } from 'app/paths'
import CompanyOfficersService from 'app/services/company-officers/companyOfficers.service'
import CompanyService from 'app/services/company/company.service'
import SessionService from 'app/services/session/session.service'

interface ViewModel {
  company: CompanyDetails
  error: string | null
}

@controller(VIEW_COMPANY_INFORMATION_URI)
export class ViewCompanyInformationController extends BaseController {

  public constructor(
    @inject(SessionService) private session: SessionService,
    @inject(CompanyService) private companyService: CompanyService,
    @inject(CompanyOfficersService) private companyOfficersService: CompanyOfficersService) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

    const company: CompanyDetails = await this.getCompanyInfo(session)

    const token: string = this.session.getAccessToken(this.httpContext.request)

    const companyOfficers: DirectorDetails[] = await this.companyOfficersService.getActiveDirectorsForCompany(token, company.companyNumber)

    const error: string | null = this.validateCompanyDetails(company, companyOfficers)

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

  private async getCompanyInfo(session: DissolutionSession): Promise<CompanyDetails> {
    const companyNumber: string = session.companyNumber!
    const token: string = this.session.getAccessToken(this.httpContext.request)

    return this.companyService.getCompanyDetails(token, companyNumber)
  }

  private updateSession(session: DissolutionSession, company: CompanyDetails): void {
    const updatedSession: DissolutionSession = {
      ...session,
      officerType: company.companyType === ClosableCompanyType.LLP ? OfficerType.MEMBER : OfficerType.DIRECTOR
    }
    this.session.setDissolutionSession(this.httpContext.request, updatedSession)
  }

  private validateCompanyDetails(company: CompanyDetails, companyOfficers: DirectorDetails[]): string | null {
    if (!Object.values(ClosableCompanyType).some(val => val === company.companyType)) {
      return `Company type of ${company.companyType} cannot be closed via this service.
              <a target="_blank" href="https://www.gov.uk/government/publications/company-strike-off-dissolution-and-restoration/strike-off-dissolution-and-restoration#when-a-company-cannot-apply-to-be-struck-off-the-register"> Read guidance here (opens in new tab)</a>.`
    }

    if (company.companyStatus !== CompanyStatus.ACTIVE) {
      return 'The company is not currently active and cannot be closed.'
    }

    if (Object.values(OverseasCompanyPrefix).some(invalidPrefix => company.companyNumber.startsWith(invalidPrefix))) {
      return 'This is an overseas company, and cannot be closed using this service.'
    }

    if (companyOfficers.length === 0) {
      return 'The company has no active members / directors.'
    }

    return null
  }
}
