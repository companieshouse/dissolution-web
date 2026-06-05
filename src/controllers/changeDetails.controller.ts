import {StatusCodes} from "http-status-codes"
import {inject} from "inversify"
import {controller, httpGet, httpPost, requestBody} from "inversify-express-utils"
import {RedirectResult} from "inversify-express-utils/lib/results"

import {NotFoundError} from "app/errors/notFoundError.error"
import DissolutionDirectorMapper from "app/mappers/dissolution/dissolutionDirector.mapper"
import DissolutionGetDirector, {isCorporateOfficer} from "app/models/dto/dissolutionGetDirector"
import OfficerType from "app/models/dto/officerType.enum"
import ChangeDetailsFormModel from "app/models/form/changeDetails.model"
import Optional from "app/models/optional"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import ValidationErrors from "app/models/view/validationErrors.model"
import {CHANGE_DETAILS_URI, CHECK_YOUR_ANSWERS_URI, WAIT_FOR_OTHERS_TO_SIGN_URI} from "app/paths"
import changeDetailsSchema from "app/schemas/changeDetails.schema"
import DissolutionDirectorService from "app/services/dissolution/dissolutionDirector.service"
import SessionService from "app/services/session/session.service"
import FormValidator from "app/utils/formValidator.util"
import {DirectorToSign} from "app/models/session/directorToSign.model"
import RichFormValidator from "app/utils/richFormValidator.util"
import {DefineSignatoryInfoFormModel} from "app/models/form/defineSignatoryInfo.model"
import TYPES from "app/types";
import JourneyPathService from "app/services/session/journeyPath.service";
import JourneyBaseController from "app/controllers/JourneyBase.controller";

interface ViewModel {
    officerType: OfficerType
    backUri: string
    signatory: SignatoryViewModel
    data?: Optional<ChangeDetailsFormModel>
    errors?: Optional<ValidationErrors>
}

interface SignatoryViewModel {
    name: string
    isCorporateOfficer: boolean
}

@controller(CHANGE_DETAILS_URI, TYPES.JourneyIdAuthMiddleware)
export class ChangeDetailsController extends JourneyBaseController {

    public constructor(
        @inject(SessionService) private readonly session: SessionService,
        @inject(DissolutionDirectorService) private readonly directorService: DissolutionDirectorService,
        @inject(DissolutionDirectorMapper) private readonly directorMapper: DissolutionDirectorMapper,
        @inject(RichFormValidator) private readonly validator: FormValidator,
        @inject(JourneyPathService) readonly journeyPathService: JourneyPathService) {
        super(journeyPathService)
    }

    @httpGet("")
    public async get(): Promise<string> {
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

    private updateSession(session: DissolutionSession, signatory: DissolutionGetDirector) {
        session.signatoryToEdit = signatory
        this.session.setDissolutionSession(this.httpContext.request, session)
    }

    @httpPost("")
    public async post(@requestBody() body: ChangeDetailsFormModel): Promise<string | RedirectResult> {
        const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!

        if (!session.signatoryIdToEdit || !session.signatoryToEdit) {
            return Promise.reject(new NotFoundError("Signatory not in session"))
        }

        const form = this.normalizeFormModelData(body)

        const signatory: DissolutionGetDirector = session.signatoryToEdit
        const errors: Optional<ValidationErrors> = this.validator.validate(form, changeDetailsSchema(signatory))

        if (errors) {
            return this.renderView(session.officerType!, this.getBackLink(session), signatory, form, errors)
        }

        if (session.isFromCheckAnswers) {
            this.updateSignatoryInfoInSession(session, form)
            return this.redirect(this.journeyPath(CHECK_YOUR_ANSWERS_URI))
        } else {
            const token: string = this.session.getAccessToken(this.httpContext.request)
            await this.directorService.updateSignatory(token, session, form)
            this.cleanUpSession(session)
            this.session.setDissolutionSession(this.httpContext.request, session)
            return this.redirect(this.journeyPath(WAIT_FOR_OTHERS_TO_SIGN_URI))
        }
    }

    private cleanUpSession(session: DissolutionSession) {
        delete session.signatoryToEdit
        delete session.isFromCheckAnswers
    }

    private normalizeFormModelData(body: ChangeDetailsFormModel): ChangeDetailsFormModel {
        return {
            ...body,
            ...(body.directorEmail && {directorEmail: body.directorEmail.trim().toLowerCase()}),
            ...(body.onBehalfEmail && {onBehalfEmail: body.onBehalfEmail.trim().toLowerCase()})
        }
    }

    private async renderView(
        officerType: OfficerType,
        backUri: string,
        signatory: DissolutionGetDirector,
        data?: Optional<ChangeDetailsFormModel>,
        errors?: Optional<ValidationErrors>): Promise<string> {

        const signatoryViewModel = {
            name: signatory.name,
            isCorporateOfficer: isCorporateOfficer(signatory)
        }

        const viewModel: ViewModel = {
            officerType,
            backUri,
            signatory: signatoryViewModel,
            data,
            errors
        }

        return super.render("change-details", viewModel, errors ? StatusCodes.BAD_REQUEST : StatusCodes.OK)
    }

    private getBackLink(session: DissolutionSession): string {
        return session.isFromCheckAnswers ? CHECK_YOUR_ANSWERS_URI : WAIT_FOR_OTHERS_TO_SIGN_URI
    }

    private updateSignatoryInfoInSession(session: DissolutionSession, body: ChangeDetailsFormModel) {
        const directorsToSign = session.directorsToSign
        if (!directorsToSign) {
            throw new NotFoundError("Could not retrieve signatories from session")
        }
        const updateIndex = directorsToSign.findIndex((director) => director.id === session.signatoryIdToEdit)
        if (updateIndex < 0) {
            throw new NotFoundError("Signatory ID not found in session")
        }

        session.directorsToSign = this.withSignatoryDetailsFromForm(session.signatoryIdToEdit!, directorsToSign, body)

        session.defineSignatoryInfoForm = this.withUpdatedDefineSignatoryInfoForm(
            session.signatoryIdToEdit!,
            session.defineSignatoryInfoForm || {},
            body)

        this.cleanUpSession(session)
        this.session.setDissolutionSession(this.httpContext.request, session)
    }

    private withUpdatedDefineSignatoryInfoForm(
        signatoryId: string,
        defineSignatoryInfoFormModel: DefineSignatoryInfoFormModel,
        changeDetailsFormModel: ChangeDetailsFormModel
    ): DefineSignatoryInfoFormModel {

        // The define-signatory-info view lowers the id's in the view...
        const id = signatoryId.toLowerCase()

        const directorEmailKey = `directorEmail_${id}`
        const onBehalfNameKey = `onBehalfName_${id}`
        const onBehalfEmailKey = `onBehalfEmail_${id}`

        const isOnBehalf = !!defineSignatoryInfoFormModel[onBehalfNameKey] && defineSignatoryInfoFormModel[onBehalfNameKey] !== ""

        return isOnBehalf
            ? {
                ...defineSignatoryInfoFormModel,
                [onBehalfNameKey]: changeDetailsFormModel.onBehalfName ?? "",
                [onBehalfEmailKey]: changeDetailsFormModel.onBehalfEmail ?? ""
            }
            : {
                ...defineSignatoryInfoFormModel,
                [directorEmailKey]: changeDetailsFormModel.directorEmail ?? ""
            }
    }

    private withSignatoryDetailsFromForm(
        signatoryId: string,
        directorsToSign: DirectorToSign[],
        body: ChangeDetailsFormModel
    ): DirectorToSign[] {
        return directorsToSign.map((director) =>
            director.id !== signatoryId
                ? director
                : {
                    ...director,
                    email: director.onBehalfName ? body.onBehalfEmail : body.directorEmail,
                    ...(director.onBehalfName ? {onBehalfName: body.onBehalfName} : {})
                }
        )
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
        if (!signatory) {
            throw new NotFoundError("Signatory to edit not found in session")
        }
        return signatory
    }
}
