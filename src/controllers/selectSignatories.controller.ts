import { BAD_REQUEST, OK } from 'http-status-codes'
import { inject } from 'inversify'
import { controller, httpGet, httpPost, requestBody } from 'inversify-express-utils'
import { RedirectResult } from 'inversify-express-utils/dts/results'
import BaseController from './base.controller'

import SelectSignatoriesFormModel from 'app/models/form/selectSignatories.model'
import Optional from 'app/models/optional'
import DirectorToSign from 'app/models/session/directorToSign.model'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import DirectorDetails from 'app/models/view/directorDetails.model'
import ValidationErrors from 'app/models/view/validationErrors.model'
import { DEFINE_SIGNATORY_INFO_URI, SELECT_SIGNATORIES_URI } from 'app/paths'
import selectSignatoriesSchema from 'app/schemas/selectSignatories.schema'
import CompanyOfficersService from 'app/services/company-officers/companyOfficers.service'
import SessionService from 'app/services/session/session.service'
import TYPES from 'app/types'
import FormValidator from 'app/utils/formValidator.util'

interface ViewModel {
  signatories: DirectorDetails[]
  data?: Optional<SelectSignatoriesFormModel>
  errors?: Optional<ValidationErrors>
}

@controller(SELECT_SIGNATORIES_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware, TYPES.CompanyAuthMiddleware)
export class SelectSignatoriesController extends BaseController {

  public constructor(
    @inject(SessionService) private session: SessionService,
    @inject(CompanyOfficersService) private officerService: CompanyOfficersService,
    @inject(FormValidator) private validator: FormValidator) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

    const signatories: DirectorDetails[] = await this.getSignatories(session.selectDirectorForm!.director!)

    return this.renderView(signatories, session.selectSignatoriesForm)
  }

  @httpPost('')
  public async post(@requestBody() body: SelectSignatoriesFormModel): Promise<string | RedirectResult> {
    if (typeof body.signatories === 'string') {
      body.signatories = [body.signatories]
    }

    const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

    const signatories: DirectorDetails[] = await this.getSignatories(session.selectDirectorForm!.director!)

    const errors: Optional<ValidationErrors> = this.validate(body, signatories.length, session)
    if (errors) {
      return this.renderView(signatories, body, errors)
    }

    this.updateSession(session, body, signatories)

    return this.redirect(DEFINE_SIGNATORY_INFO_URI)
  }

  private async getSignatories(selectedDirector: string): Promise<DirectorDetails[]> {
    const companyNumber: string = this.getCompanyNumber()
    const token: string = this.session.getAccessToken(this.httpContext.request)

    return this.officerService.getActiveDirectorsForCompany(token, companyNumber, selectedDirector)
  }

  private getCompanyNumber(): string {
    return this.session.getDissolutionSession(this.httpContext.request)!.companyNumber!
  }

  private async renderView(
    signatories: DirectorDetails[],
    data?: Optional<SelectSignatoriesFormModel>,
    errors?: Optional<ValidationErrors>): Promise<string> {
    const viewModel: ViewModel = {
      signatories,
      data,
      errors
    }

    return super.render('select-signatories', viewModel, errors ? BAD_REQUEST : OK)
  }

  private validate(body: SelectSignatoriesFormModel, totalSignatories: number, session: DissolutionSession): Optional<ValidationErrors> {
    const minSignatories: number = this.officerService.getMinimumNumberOfSignatores(totalSignatories, session.selectDirectorForm!.director!)
    return this.validator.validate(body, selectSignatoriesSchema(minSignatories))
  }

  private updateSession(session: DissolutionSession, body: SelectSignatoriesFormModel, signatories: DirectorDetails[]): void {
    if (!this.hasFormChanged(body, session)) {
      return
    }

    const updatedSession: DissolutionSession = {
      ...session,
      selectSignatoriesForm: body,
      directorsToSign: this.getDirectorsToSign(session, body, signatories)
    }

    this.session.setDissolutionSession(this.httpContext.request, updatedSession)
  }

  private hasFormChanged(body: SelectSignatoriesFormModel, session: DissolutionSession): boolean {
    return JSON.stringify(session.selectSignatoriesForm!) !== JSON.stringify(body)
  }

  private getDirectorsToSign(session: DissolutionSession, body: SelectSignatoriesFormModel,
    signatories: DirectorDetails[]): DirectorToSign[] {
    return session.directorsToSign!
      .filter(director => director.isApplicant)
      .concat(this.getSelectedSignatories(body, signatories))
  }

  private getSelectedSignatories(body: SelectSignatoriesFormModel, signatories: DirectorDetails[]): DirectorToSign[] {
    return signatories
      .filter(signatory => body.signatories!.includes(signatory.id))
      .map(this.mapToSelectedSignatory)
  }

  private mapToSelectedSignatory(selectedSingatory: DirectorDetails): DirectorToSign {
    return {
      id: selectedSingatory.id,
      name: selectedSingatory.name,
      isApplicant: false
    }
  }
}
