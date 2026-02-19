import { StatusCodes } from "http-status-codes"
import { inject } from "inversify"
import { controller, httpGet, httpPost, requestBody } from "inversify-express-utils"
import { RedirectResult } from "inversify-express-utils/lib/results"
import BaseController from "./base.controller"

import OfficerType from "app/models/dto/officerType.enum"
import { DefineSignatoryInfoFormModel } from "app/models/form/defineSignatoryInfo.model"
import Optional from "app/models/optional"
import { DirectorToSign } from "app/models/session/directorToSign.model"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import ValidationErrors from "app/models/view/validationErrors.model"
import { CHECK_YOUR_ANSWERS_URI, DEFINE_SIGNATORY_INFO_URI } from "app/paths"
import defineSignatoryInfoSchema from "app/schemas/defineSignatoryInfo.schema"
import SessionService from "app/services/session/session.service"
import SignatoryService from "app/services/signatories/signatory.service"
import FormValidator from "app/utils/formValidator.util"
import { isCorporateOfficer } from "app/models/dto/officerRole.enum"

interface ViewModel {
    officerType: OfficerType
    signatories: SignatoryViewModel[]
    isMultiDirector: boolean
    data?: Optional<DefineSignatoryInfoFormModel>
    errors?: Optional<ValidationErrors>
}

interface SignatoryViewModel {
    id: string
    name: string
    officerRole: string
    isApplicant: boolean
    isCorporateOfficer: boolean
}

@controller(DEFINE_SIGNATORY_INFO_URI)
export class DefineSignatoryInfoController extends BaseController {

    public constructor (
        @inject(SessionService) private session: SessionService,
        @inject(SignatoryService) private signatoryService: SignatoryService,
        @inject(FormValidator) private validator: FormValidator) {
        super()
    }

    private getViewableSignatories (session: DissolutionSession): DirectorToSign[] {
        return (session.directorsToSign || []).filter(director => !director.isApplicant)
    }

    @httpGet("")
    public async get (): Promise<string> {
        const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!
        const viewableSignatories = this.getViewableSignatories(session)
        return this.renderView(session.officerType!, viewableSignatories, session.isMultiDirector!, session.defineSignatoryInfoForm)
    }

    @httpPost("")
    public async post (@requestBody() body: DefineSignatoryInfoFormModel): Promise<string | RedirectResult> {
        const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!
        const officerType: OfficerType = session.officerType!

        const viewableSignatories: DirectorToSign[] = this.getViewableSignatories(session)

        const errors: Optional<ValidationErrors> = this.validator.validate(body, defineSignatoryInfoSchema(viewableSignatories))
        if (errors) {
            return this.renderView(officerType, viewableSignatories, session.isMultiDirector!, body, errors)
        }

        this.updateSession(session, body)

        return this.redirect(CHECK_YOUR_ANSWERS_URI)
    }

    private async renderView (
        officerType: OfficerType,
        signatories: DirectorToSign[],
        isMultiDirector: boolean,
        data?: Optional<DefineSignatoryInfoFormModel>,
        errors?: Optional<ValidationErrors>): Promise<string> {
        const viewModel: ViewModel = {
            officerType,
            signatories: this.mapToSignatoryViewModels(signatories),
            isMultiDirector,
            data,
            errors
        }

        return super.render("define-signatory-info", viewModel, errors ? StatusCodes.BAD_REQUEST : StatusCodes.OK)
    }

    private mapToSignatoryViewModels (signatories: DirectorToSign[]): SignatoryViewModel[] {
        return (signatories || []).map(director => ({
            id: director.id,
            name: director.name,
            officerRole: director.officerRole,
            isApplicant: director.isApplicant,
            isCorporateOfficer: isCorporateOfficer(director.officerRole)
        }))
    }

    private updateSession (session: DissolutionSession, body: DefineSignatoryInfoFormModel): void {
        if (!this.hasFormChanged(session, body)) {
            return
        }

        const updatedSignatories = this.signatoryService.updateSignatoriesWithContactInfo(session.directorsToSign || [], body)

        const updatedSession: DissolutionSession = {
            ...session,
            defineSignatoryInfoForm: body,
            directorsToSign: updatedSignatories
        }

        this.session.setDissolutionSession(this.httpContext.request, updatedSession)
    }

    private hasFormChanged (session: DissolutionSession, body: DefineSignatoryInfoFormModel): boolean {
        return JSON.stringify(session.defineSignatoryInfoForm) !== JSON.stringify(body)
    }
}
