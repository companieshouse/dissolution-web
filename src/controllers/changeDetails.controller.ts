import { StatusCodes } from "http-status-codes"
import { inject } from "inversify"
import { controller, httpGet, httpPost, requestBody } from "inversify-express-utils"
import { RedirectResult } from "inversify-express-utils/lib/results"
import BaseController from "./base.controller"

import { NotFoundError } from "app/errors/notFoundError.error"
import DissolutionDirectorMapper from "app/mappers/dissolution/dissolutionDirector.mapper"
import DissolutionGetDirector, { isCorporateOfficer } from "app/models/dto/dissolutionGetDirector"
import OfficerType from "app/models/dto/officerType.enum"
import ChangeDetailsFormModel from "app/models/form/changeDetails.model"
import Optional from "app/models/optional"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import ValidationErrors from "app/models/view/validationErrors.model"
import { CHANGE_DETAILS_URI, WAIT_FOR_OTHERS_TO_SIGN_URI } from "app/paths"
import changeDetailsSchema from "app/schemas/changeDetails.schema"
import DissolutionDirectorService from "app/services/dissolution/dissolutionDirector.service"
import SessionService from "app/services/session/session.service"
import FormValidator from "app/utils/formValidator.util"

interface ViewModel {
    officerType: OfficerType
    signatory: SignatoryViewModel
    data?: Optional<ChangeDetailsFormModel>
    errors?: Optional<ValidationErrors>
}

interface SignatoryViewModel {
    name: string
    isCorporateOfficer: boolean
}

@controller(CHANGE_DETAILS_URI)
export class ChangeDetailsController extends BaseController {

    public constructor (
        @inject(SessionService) private session: SessionService,
        @inject(DissolutionDirectorService) private directorService: DissolutionDirectorService,
        @inject(DissolutionDirectorMapper) private directorMapper: DissolutionDirectorMapper,
        @inject(FormValidator) private validator: FormValidator) {
        super()
    }

    @httpGet("")
    public async get (): Promise<string> {
        const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

        if (!session.signatoryIdToEdit) {
            return Promise.reject(new NotFoundError("Signatory not in session"))
        }

        const token: string = this.session.getAccessToken(this.httpContext.request)
        const signatory: DissolutionGetDirector = await this.directorService.getSignatoryToEdit(token, session)
        this.updateSession(session, signatory)

        const form: ChangeDetailsFormModel = this.directorMapper.mapToChangeDetailsForm(signatory)

        return this.renderView(session.officerType!, signatory, form)
    }

    private updateSession (session: DissolutionSession, signatory: DissolutionGetDirector) {
        session.signatoryToEdit = signatory
        this.session.setDissolutionSession(this.httpContext.request, session)
    }

    @httpPost("")
    public async post (@requestBody() body: ChangeDetailsFormModel): Promise<string | RedirectResult> {
        const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

        if (!session.signatoryIdToEdit) {
            return Promise.reject(new NotFoundError("Signatory not in session"))
        }

        const token: string = this.session.getAccessToken(this.httpContext.request)
        const signatory: DissolutionGetDirector = session.signatoryToEdit!
        const errors: Optional<ValidationErrors> = this.validator.validate(body, changeDetailsSchema(signatory))

        if (errors) {
            const signatory: DissolutionGetDirector = await this.directorService.getSignatoryToEdit(token, session)
            return this.renderView(session.officerType!, signatory, body, errors)
        }

        await this.directorService.updateSignatory(token, session, body)
        this.cleanUpSession(session)

        return this.redirect(WAIT_FOR_OTHERS_TO_SIGN_URI)
    }

    private cleanUpSession (session: DissolutionSession) {
        delete session.signatoryToEdit
        this.session.setDissolutionSession(this.httpContext.request, session)
    }

    private async renderView (
        officerType: OfficerType,
        signatory: DissolutionGetDirector,
        data?: Optional<ChangeDetailsFormModel>,
        errors?: Optional<ValidationErrors>): Promise<string> {

        const signatoryViewModel = {
            name: signatory.name,
            isCorporateOfficer: isCorporateOfficer(signatory)
        }

        const viewModel: ViewModel = {
            officerType,
            signatory: signatoryViewModel,
            data,
            errors
        }

        return super.render("change-details", viewModel, errors ? StatusCodes.BAD_REQUEST : StatusCodes.OK)
    }
}
