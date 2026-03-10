import { StatusCodes } from "http-status-codes"
import { inject } from "inversify"
import { controller, httpGet, httpPost, requestBody } from "inversify-express-utils"
import { RedirectResult } from "inversify-express-utils/lib/results"
import BaseController from "./base.controller"

import DissolutionApprovalModel from "app/models/form/dissolutionApproval.model"
import generateEndorseCertificateFormModel from "app/models/form/endorseCertificateFormModel"
import Optional from "app/models/optional"
import DissolutionSession from "app/models/session/dissolutionSession.model"
import ValidationErrors from "app/models/view/validationErrors.model"
import { ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI, REDIRECT_GATE_URI, VIEW_COMPANY_INFORMATION_URI } from "app/paths"
import formSchema from "app/schemas/endorseCertificate.schema"
import DissolutionService from "app/services/dissolution/dissolution.service"
import IpAddressService from "app/services/ip-address/ipAddress.service"
import SessionService from "app/services/session/session.service"
import FormValidator from "app/utils/formValidator.util"
import CompanyOfficersService from "app/services/company-officers/companyOfficers.service"

interface ViewModel {
  approvalModel: DissolutionApprovalModel
  errors?: ValidationErrors
  backUri?: string
}

@controller(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
export class EndorseCompanyClosureCertificateController extends BaseController {

    public constructor (@inject(SessionService) private readonly session: SessionService,
                    @inject(FormValidator) private readonly validator: FormValidator,
                    @inject(DissolutionService) private readonly dissolutionService: DissolutionService,
                    @inject(IpAddressService) private readonly ipAddressService: IpAddressService,
                    @inject(CompanyOfficersService) private readonly companyOfficersService: CompanyOfficersService) {
        super()
    }

    @httpGet("")
    public async get (): Promise<string> {
        const approvalModel = await this.prepareApprovalModel()
        const backUri = this.getBackUri(approvalModel.companyNumber)
        return this.renderView(approvalModel, backUri)
    }

    @httpPost("")
    public async post (@requestBody() body: generateEndorseCertificateFormModel): Promise<string | RedirectResult> {
        const approvalModel = await this.prepareApprovalModel()
        const backUri = this.getBackUri(approvalModel.companyNumber)

        const validationSchema = this.getValidationSchema(approvalModel)
        const errors: Optional<ValidationErrors> = this.validator.validate(body, validationSchema)
        
        if (errors) {
            return this.renderView(approvalModel, backUri, errors)
        }

        await this.approveDissolution()

        return this.redirect(REDIRECT_GATE_URI)
    }

    private getConfirmationErrorMessage(approvalModel: DissolutionApprovalModel): string {
        return approvalModel.isCorporateOfficer
            ? "Confirm that you are the named person and you are authorised to sign on the corporate director's behalf"
            : "Confirm that you are the named director of this company"
    }

    private getValidationSchema(approvalModel: DissolutionApprovalModel) {
        const confirmationErrorMsg = this.getConfirmationErrorMessage(approvalModel)
        return formSchema.keys({
            confirmation: formSchema.extract("confirmation").messages({
                "any.required": confirmationErrorMsg
            })
        })
    }

    private async approveDissolution (): Promise<void> {
        const token: string = this.session.getAccessToken(this.httpContext.request)
        const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!
        const ipAddress: string = this.ipAddressService.getIpAddress(this.httpContext.request)

        await this.dissolutionService.approveDissolution(token, dissolutionSession, ipAddress)
    }

    private async prepareApprovalModel (): Promise<DissolutionApprovalModel> {
        const token: string = this.session.getAccessToken(this.httpContext.request)
        const dissolutionSession: DissolutionSession = this.session.getDissolutionSession(this.httpContext.request)!
        const approvalModel = dissolutionSession.approval!

        // Determine if officer is a corporate officer
        approvalModel.isCorporateOfficer = await this.companyOfficersService.isCorporateOfficer(token, approvalModel.companyNumber, approvalModel.officerId)
        return approvalModel
    }

    private getBackUri (companyNumber: string): string {
        return VIEW_COMPANY_INFORMATION_URI + "?companyNumber=" + companyNumber
    }

    private async renderView (approvalModel: DissolutionApprovalModel, backUri: string, errors?: ValidationErrors): Promise<string> {
        
        const viewModel: ViewModel = {
            approvalModel,
            errors,
            backUri
        }
        return super.render("endorse-company-closure-certificate", viewModel, errors ? StatusCodes.BAD_REQUEST : StatusCodes.OK)
    }
}
