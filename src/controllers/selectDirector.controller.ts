import { BAD_REQUEST, OK } from 'http-status-codes'
import { inject } from 'inversify'
import { controller, httpGet, httpPost, requestBody } from 'inversify-express-utils'
import BaseController from './base.controller'

import DirectorDetails from 'app/models/directorDetails.model'
import Optional from 'app/models/optional'
import SelectDirectorFormModel from 'app/models/selectDirector.model'
import ValidationErrors from 'app/models/validationErrors'
import { CHECK_YOUR_ANSWERS_URI, DEFINE_SIGNATORY_INFO_URI, SELECT_DIRECTOR_URI, SELECT_SIGNATORIES_URI } from 'app/paths'
import selectDirectorSchema from 'app/schemas/selectDirector.schema'
import CompanyOfficersService from 'app/services/company-officers/companyOfficers.service'
import SessionService from 'app/services/session/session.service'
import TYPES from 'app/types'
import FormValidator from 'app/utils/formValidator.util'

interface ViewModel {
  directors: DirectorDetails[]
  data?: SelectDirectorFormModel
  errors?: ValidationErrors
}

// TODO - include company auth middleware when available
@controller(SELECT_DIRECTOR_URI, TYPES.SessionMiddleware, TYPES.AuthMiddleware)
export class SelectDirectorController extends BaseController {

  public constructor(
    @inject(SessionService) private session: SessionService,
    @inject(CompanyOfficersService) private officerService: CompanyOfficersService,
    @inject(FormValidator) private validator: FormValidator) {
    super()
  }

  @httpGet('')
  public async get(): Promise<string> {
    // TODO - get selection from session and prepopulate screen
    const directors: DirectorDetails[] = await this.getDirectors()

    return this.renderView(directors)
  }

  @httpPost('')
  public async post(@requestBody() body: SelectDirectorFormModel): Promise<string | void> {
    const directors: DirectorDetails[] = await this.getDirectors()

    const errors: Optional<ValidationErrors> = this.validator.validate(body, selectDirectorSchema)
    if (errors) {
      return this.renderView(directors, body, errors)
    }

    // TODO - save selection to session

    return this.httpContext.response.redirect(this.getRedirectURI(directors, body))
  }

  private async getDirectors(): Promise<DirectorDetails[]> {
    const companyNumber: string =  '01777777' // TODO read from session
    const token: string = this.session.getAccessToken(this.httpContext.request)

    return this.officerService.getActiveDirectorsForCompany(token, companyNumber)
  }

  private async renderView(directors: DirectorDetails[], data?: SelectDirectorFormModel,
    errors?: ValidationErrors): Promise<string> {
    const viewModel: ViewModel = {
      directors,
      data,
      errors
    }

    return super.render('select-director', viewModel, errors ? BAD_REQUEST : OK)
  }

  private getRedirectURI(directors: DirectorDetails[], body: SelectDirectorFormModel): string {
    if (directors.length > 1) {
      return SELECT_SIGNATORIES_URI
    }

    return this.isADirector(directors, body) ? CHECK_YOUR_ANSWERS_URI : DEFINE_SIGNATORY_INFO_URI
  }

  private isADirector(directors: DirectorDetails[], body: SelectDirectorFormModel): boolean {
    return directors.some(director => director.id === body.director)
  }
}
