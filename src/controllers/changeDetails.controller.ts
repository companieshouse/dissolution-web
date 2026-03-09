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
import { CHANGE_DETAILS_URI, CHECK_YOUR_ANSWERS_URI, WAIT_FOR_OTHERS_TO_SIGN_URI } from "app/paths"
import changeDetailsSchema from "app/schemas/changeDetails.schema"
import DissolutionDirectorService from "app/services/dissolution/dissolutionDirector.service"
import SessionService from "app/services/session/session.service"
import FormValidator from "app/utils/formValidator.util"
import { DirectorToSign } from "app/models/session/directorToSign.model"
import RichFormValidator from "app/utils/richFormValidator.util"

interface ViewModel {
    officerType: OfficerType
    backURI: string
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
        @inject(SessionService) private readonly session: SessionService,
        @inject(DissolutionDirectorService) private readonly directorService: DissolutionDirectorService,
        @inject(DissolutionDirectorMapper) private readonly directorMapper: DissolutionDirectorMapper,
        @inject(RichFormValidator) private readonly validator: FormValidator) {
        super()
    }

    @httpGet("")
    public async get (): Promise<string> {
        const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

        if (!session.signatoryIdToEdit) {
            return Promise.reject(new NotFoundError("Signatory not in session"))
        }

        const signatory = session.isFromCheckAnswers ? this.getSignatoryFromSession(session) 
            : await this.getSignatoryFromDissolution(session)

        this.updateSession(session, signatory)

        const form: ChangeDetailsFormModel = this.directorMapper.mapToChangeDetailsForm(signatory)
        return this.renderView(session.officerType!, this.getBackLink(session), signatory, form)
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
        let signatory: DissolutionGetDirector = session.signatoryToEdit!
        const errors: Optional<ValidationErrors> = this.validator.validate(body, changeDetailsSchema(signatory))

        if (errors) {
            if (!session.isFromCheckAnswers) {
                signatory = await this.directorService.getSignatoryToEdit(token, session)
            }
            return this.renderView(session.officerType!, this.getBackLink(session), signatory, body, errors)
        }

        let redirectUri
        if(session.isFromCheckAnswers) {
            const directorsToSign = session.directorsToSign
            if(directorsToSign != null) {
                this.updateSignatoryInSession(session, body, directorsToSign)
                redirectUri = CHECK_YOUR_ANSWERS_URI
            } else {
                return Promise.reject(new NotFoundError("Could not retrieve signatories from session"))
            }
        } else {
            await this.directorService.updateSignatory(token, session, body)
            redirectUri = WAIT_FOR_OTHERS_TO_SIGN_URI
        }

        this.cleanUpSession(session)

        return this.redirect(redirectUri)
    }

    private cleanUpSession (session: DissolutionSession) {
        delete session.signatoryToEdit
        delete session.isFromCheckAnswers
        this.session.setDissolutionSession(this.httpContext.request, session)
    }

    private async renderView (
        officerType: OfficerType,
        backURI: string,
        signatory: DissolutionGetDirector,
        data?: Optional<ChangeDetailsFormModel>,
        errors?: Optional<ValidationErrors>): Promise<string> {

        const signatoryViewModel = {
            name: signatory.name,
            isCorporateOfficer: isCorporateOfficer(signatory)
        }

        const viewModel: ViewModel = {
            officerType,
            backURI,
            signatory: signatoryViewModel,
            data,
            errors
        }

        return super.render("change-details", viewModel, errors ? StatusCodes.BAD_REQUEST : StatusCodes.OK)
    }

    private getBackLink (session: DissolutionSession): string {
        return session.isFromCheckAnswers ? CHECK_YOUR_ANSWERS_URI : WAIT_FOR_OTHERS_TO_SIGN_URI
    }

    private updateSignatoryInSession(session: DissolutionSession, body: ChangeDetailsFormModel, directorsToSign: DirectorToSign[]) {
        const updateIndex = directorsToSign?.findIndex((director) => director.id === session.signatoryIdToEdit)
        if (updateIndex === undefined || updateIndex === null || updateIndex < 0) {
            throw new NotFoundError("Signatory ID not found in session")
        }
        if (directorsToSign[updateIndex].onBehalfName) {
            directorsToSign[updateIndex].email = body.onBehalfEmail
            directorsToSign[updateIndex].onBehalfName = body.onBehalfName
        } else {
            directorsToSign[updateIndex].email = body.directorEmail
        }
        session.directorsToSign = directorsToSign
    }

    private getSignatoryFromSession(session: DissolutionSession) {
        const directorsToSign = session.directorsToSign
        if (!directorsToSign) {
            throw new NotFoundError("Signatories not found in session")
        }
        const directorToEdit: DirectorToSign | undefined = directorsToSign.find((director) => director.id === session.signatoryIdToEdit)
        if (!directorToEdit) {
            throw new NotFoundError("Signatory to edit not found in session")
        }
        return this.directorMapper.mapToDissolutionDirector(directorToEdit)
    }

    private async getSignatoryFromDissolution(session: DissolutionSession) {
        const token: string = this.session.getAccessToken(this.httpContext.request)
        const signatory = await this.directorService.getSignatoryToEdit(token, session)
        if(!signatory) {
            throw new NotFoundError("Signatory to edit not found in session")
        }
        return signatory
    }
}
