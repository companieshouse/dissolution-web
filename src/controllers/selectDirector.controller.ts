import { StatusCodes } from "http-status-codes"
import { inject } from "inversify"
import { controller, httpGet, httpPost, requestBody } from "inversify-express-utils"
import { RedirectResult } from "inversify-express-utils/lib/results"
import BaseController from "./base.controller"

import DirectorToSignMapper from "app/mappers/check-your-answers/directorToSign.mapper"
import OfficerType from "app/models/dto/officerType.enum"
import SelectDirectorFormModel from "app/models/form/selectDirector.model"
import Optional from "app/models/optional"
import { DirectorToSign } from "app/models/session/directorToSign.model"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import DirectorDetails from "app/models/view/directorDetails.model"
import SelectedDirectorDetails from "app/models/view/selectedDirectorDetails.model"
import ValidationErrors from "app/models/view/validationErrors.model"
import { CHECK_YOUR_ANSWERS_URI, DEFINE_SIGNATORY_INFO_URI, SELECT_DIRECTOR_URI, SELECT_SIGNATORIES_URI } from "app/paths"
import selectDirectorSchema from "app/schemas/selectDirector.schema"
import CompanyOfficersService from "app/services/company-officers/companyOfficers.service"
import SessionService from "app/services/session/session.service"
import FormValidator from "app/utils/formValidator.util"
import { isCorporateOfficer } from "app/models/dto/officerRole.enum"

interface ViewModel {
  officerType: OfficerType
  directors: DirectorViewModel[]
  data?: Optional<SelectDirectorFormModel>
  errors?: Optional<ValidationErrors>
}

interface DirectorViewModel {
    id: string,
    name: string,
    isCorporate: boolean
}

@controller(SELECT_DIRECTOR_URI)
export class SelectDirectorController extends BaseController {

    public constructor (
    @inject(SessionService) private session: SessionService,
    @inject(CompanyOfficersService) private officerService: CompanyOfficersService,
    @inject(FormValidator) private validator: FormValidator,
    @inject(DirectorToSignMapper) private mapper: DirectorToSignMapper) {
        super()
    }

    @httpGet("")
    public async get (): Promise<string> {
        const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

        const directors: DirectorDetails[] = await this.getDirectors()

        return this.renderView(session.officerType!, directors, session.selectDirectorForm)
    }

    @httpPost("")
    public async post (@requestBody() body: SelectDirectorFormModel): Promise<string | RedirectResult> {
        const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!
        const officerType: OfficerType = session.officerType!
        const directors: DirectorDetails[] = await this.getDirectors()

        const errors: Optional<ValidationErrors> = this.validator.validate(body, selectDirectorSchema(officerType, directors))
        if (errors) {
            return this.renderView(officerType, directors, body, errors)
        }

        const selectedDirector: Optional<SelectedDirectorDetails> = this.getSelectedDirector(directors, body)

        this.updateSession(session, body, directors, selectedDirector)

        return this.redirect(this.getRedirectURI(directors, selectedDirector))
    }

    private async getDirectors (): Promise<DirectorDetails[]> {
        const companyNumber: string = this.getCompanyNumber()
        const token: string = this.session.getAccessToken(this.httpContext.request)

        return this.officerService.getActiveDirectorsForCompany(token, companyNumber)
    }

    private getCompanyNumber (): string {
        return this.session.getDissolutionSession(this.httpContext.request)!.companyNumber!
    }

    private async renderView (
        officerType: OfficerType,
        directors: DirectorDetails[],
        data?: Optional<SelectDirectorFormModel>,
        errors?: Optional<ValidationErrors>): Promise<string> {

        const directorsWithCorporate: DirectorViewModel[] = directors.map(d => ({
            id: d.id,
            name: d.name,
            isCorporate: isCorporateOfficer(d.officerRole),
        }))

        const viewModel: ViewModel = {
            officerType,
            directors: directorsWithCorporate,
            data,
            errors
        }

        return super.render("select-director", viewModel, errors ? StatusCodes.BAD_REQUEST : StatusCodes.OK)
    }

    private getSelectedDirector(
        directors: DirectorDetails[],
        body: SelectDirectorFormModel
    ): Optional<SelectedDirectorDetails> {
        const selectedDirector = directors.find(director => director.id === body.director)
        if (!selectedDirector) return undefined

        const dto: SelectedDirectorDetails = {
            id: selectedDirector.id,
            name: selectedDirector.name,
            officerRole: selectedDirector.officerRole
        }

        if (isCorporateOfficer(selectedDirector.officerRole)) {
            const onBehalfNameKey = `onBehalfName_${selectedDirector.id}`
            const onBehalfName = (body[onBehalfNameKey] || "").toString().trim()
            if (!onBehalfName) {
                throw new Error(`onBehalfName for key ${onBehalfNameKey} must be a non-empty string`)
            }
            dto.onBehalfName = onBehalfName
        }
        return dto
    }

    private updateSession (
        session: DissolutionSession,
        body: SelectDirectorFormModel,
        directors: DirectorDetails[],
        selectedDirector?: Optional<SelectedDirectorDetails>
    ): void {

        if (!this.hasFormChanged(body, session)) {
            return
        }

        const updatedSession: DissolutionSession = {
            ...session,
            selectDirectorForm: body,
            directorsToSign: this.prepareDirectorsToSign(directors, selectedDirector),
            isMultiDirector: directors.length > 1,
            isApplicantADirector: !!selectedDirector
        }

        this.session.setDissolutionSession(this.httpContext.request, updatedSession)
    }

    private hasFormChanged(body: SelectDirectorFormModel, session: DissolutionSession): boolean {
        return JSON.stringify(session.selectDirectorForm) !== JSON.stringify(body)
    }

    private prepareDirectorsToSign (
        directors: DirectorDetails[],
        selectedDirector?: Optional<SelectedDirectorDetails>
    ): DirectorToSign[] {
        if (selectedDirector) {
            return [this.mapper.mapAsApplicant(selectedDirector, this.session.getUserEmail(this.httpContext.request)!)]
        }

        if (directors.length === 1) {
            return [this.mapper.mapAsSignatory(directors[0])]
        }

        return []
    }

    private getRedirectURI (directors: DirectorDetails[], selectedDirector?: Optional<SelectedDirectorDetails>): string {
        if (directors.length > 1) {
            return SELECT_SIGNATORIES_URI
        }

        return selectedDirector ? CHECK_YOUR_ANSWERS_URI : DEFINE_SIGNATORY_INFO_URI
    }
}
