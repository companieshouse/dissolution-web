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

interface ViewModel {
  officerType: OfficerType
  signatories: DirectorToSign[]
  isMultiDirector: boolean
  data?: Optional<DefineSignatoryInfoFormModel>
  errors?: Optional<ValidationErrors>
}

@controller(DEFINE_SIGNATORY_INFO_URI)
export class DefineSignatoryInfoController extends BaseController {

    public constructor (
    @inject(SessionService) private session: SessionService,
    @inject(SignatoryService) private signatoryService: SignatoryService,
    @inject(FormValidator) private validator: FormValidator) {
        super()
    }

    @httpGet("")
    public async get (): Promise<string> {
        const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!
        const officerType: OfficerType = session.officerType!

        const signatories: DirectorToSign[] = this.getSignatories(session)

        return this.renderView(officerType, signatories, session.isMultiDirector!, session.defineSignatoryInfoForm)
    }

    @httpPost("")
    public async post (@requestBody() body: DefineSignatoryInfoFormModel): Promise<string | RedirectResult> {
        const session: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!
        const officerType: OfficerType = session.officerType!

        const signatories: DirectorToSign[] = this.getSignatories(session)

        const errors: Optional<ValidationErrors> = this.validator.validate(body, defineSignatoryInfoSchema(signatories, officerType))
        if (errors) {
            return this.renderView(officerType, signatories, session.isMultiDirector!, body, errors)
        }

        this.updateSession(session, signatories, body)

        return this.redirect(CHECK_YOUR_ANSWERS_URI)
    }

    private getSignatories (session: DissolutionSession): DirectorToSign[] {
        return session.directorsToSign!.filter(director => !director.isApplicant)
    }

    private async renderView (
        officerType: OfficerType,
        signatories: DirectorToSign[],
        isMultiDirector: boolean,
        data?: Optional<DefineSignatoryInfoFormModel>,
        errors?: Optional<ValidationErrors>): Promise<string> {
        const viewModel: ViewModel = {
            officerType,
            signatories,
            isMultiDirector,
            data,
            errors
        }

        return super.render("define-signatory-info", viewModel, errors ? StatusCodes.BAD_REQUEST : StatusCodes.OK)
    }

    private updateSession (session: DissolutionSession, signatories: DirectorToSign[], body: DefineSignatoryInfoFormModel): void {
        if (!this.hasFormChanged(session, body)) {
            return
        }

        const updatedSession: DissolutionSession = {
            ...session,
            defineSignatoryInfoForm: body
        }

        this.signatoryService.updateSignatoriesWithContactInfo(signatories, body)

        this.session.setDissolutionSession(this.httpContext.request, updatedSession)
    }

    private hasFormChanged (session: DissolutionSession, body: DefineSignatoryInfoFormModel): boolean {
        return JSON.stringify(session.defineSignatoryInfoForm) !== JSON.stringify(body)
    }
}
