import {inject} from "inversify"
import {controller, httpGet, queryParam} from "inversify-express-utils"
import SessionService from "app/services/session/session.service"
import CompanyAuthService from "app/services/auth/companyAuth.service"
import UuidGenerator from "app/utils/uuidGenerator"
import TYPES from "app/types"
import {BOOTSTRAP_JOURNEY_URI, VIEW_COMPANY_INFORMATION_URI} from "app/paths"
import JourneyBaseController from "app/controllers/JourneyBase.controller"
import JourneyPathService from "app/services/session/journeyPath.service"
import companyNumberSchema from "app/schemas/companyNumber.schema"
import { firstParam } from "app/utils/query.util"
import {RedirectResult} from "inversify-express-utils/lib/results"

@controller(BOOTSTRAP_JOURNEY_URI)
export class BootstrapJourneyController extends JourneyBaseController {


    public constructor(
        @inject(JourneyPathService) readonly journeyPathService: JourneyPathService,
        @inject(SessionService) private readonly sessionService: SessionService,
        @inject(CompanyAuthService) private readonly companyAuthService: CompanyAuthService,
        @inject(TYPES.UuidGenerator) private readonly uuidGenerator: UuidGenerator
    ) {
        super(journeyPathService)
    }

    @httpGet("")
    public async get(@queryParam("companyNumber") rawCompanyNumber?: string | string[]): Promise<string | RedirectResult> {

        const { companyNumber, error } = this.validate(rawCompanyNumber)

        if (error || !companyNumber) {
            throw new Error("Invalid company number")
        }

        if (!this.companyAuthService.isAuthorisedForCompany(this.httpContext.request, companyNumber)) {
            const redirectUri = await this.companyAuthService.issueAuthRedirectUri(this.httpContext.request, companyNumber)
            return this.redirect(redirectUri)
        }

        const journeyId = this.uuidGenerator.generate()

        this.sessionService.initDissolutionSession(this.httpContext.request, journeyId, companyNumber)

        return this.redirect(this.journeyPath(VIEW_COMPANY_INFORMATION_URI, {journeyId}))
    }
    private validate(companyNumber?: string | string[]): { companyNumber?: string, error?: any } {
        const rawCompanyNumber = firstParam(companyNumber)
        const { value, error } = companyNumberSchema.validate(rawCompanyNumber)
        return { companyNumber: value, error }
    }
}
