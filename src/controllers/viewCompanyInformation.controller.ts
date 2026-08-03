import TYPES from "app/types";
import { inject } from "inversify";
import { controller, httpGet, httpPost } from "inversify-express-utils";
import { RedirectResult } from "inversify-express-utils/lib/results";

import CompanyDetails from "app/models/companyDetails.model";
import OfficerType from "app/models/dto/officerType.enum";
import ClosableCompanyType from "app/models/mapper/closableCompanyType.enum";
import Optional from "app/models/optional";
import DissolutionSession from "app/models/session/dissolutionSession.model";
import {
    REDIRECT_GATE_URI,
    VIEW_COMPANY_INFORMATION_URI,
    APPLY_USING_PAPER_FORM_DIRECTORS_URI,
    APPLY_USING_PAPER_FORM_MEMBERS_URI,
} from "app/paths";
import CompanyService from "app/services/company/company.service";
import CompanyOfficersService from "app/services/company-officers/companyOfficers.service";
import SessionService from "app/services/session/session.service";
import JourneyBaseController from "app/controllers/JourneyBase.controller";
import JourneyPathService from "app/services/session/journeyPath.service";
import DirectorDetails from "app/models/view/directorDetails.model";

interface ViewModel {
    company: CompanyDetails;
    error: Optional<string>;
}

@controller(VIEW_COMPANY_INFORMATION_URI, TYPES.JourneyIdAuthMiddleware)
export class ViewCompanyInformationController extends JourneyBaseController {
    public constructor(
        @inject(SessionService) readonly sessionService: SessionService,
        @inject(CompanyService) private readonly companyService: CompanyService,
        @inject(CompanyOfficersService) private readonly companyOfficersService: CompanyOfficersService,
        @inject(JourneyPathService) readonly journeyPathService: JourneyPathService
    ) {
        super(journeyPathService);
    }

    @httpGet("")
    public async get(): Promise<string | RedirectResult> {
        const session: DissolutionSession = this.sessionService.getDissolutionSession(this.httpContext.request)!;
        const token: string = this.sessionService.getAccessToken(this.httpContext.request);

        const company: CompanyDetails = await this.getCompanyInfo(token, session.companyNumber!);

        const error: Optional<string> = await this.validateCompanyDetails(token, company);

        // Check for too many directors/members
        const companyOfficers: DirectorDetails[] = await this.companyOfficersService.getActiveDirectorsForCompany(
            token,
            company.companyNumber
        );

        if (this.companyService.hasTooManyDirectorsOrMembers(companyOfficers.length)) {
            const redirectUrl =
                company.companyType === ClosableCompanyType.LLP
                    ? APPLY_USING_PAPER_FORM_MEMBERS_URI
                    : APPLY_USING_PAPER_FORM_DIRECTORS_URI;
            return this.redirect(redirectUrl);
        }

        this.updateSession(session, company);

        const viewModel: ViewModel = {
            company,
            error,
        };
        return super.render("view-company-information", viewModel);
    }

    @httpPost("")
    public post(): void {
        this.httpContext.response.redirect(this.journeyPath(REDIRECT_GATE_URI));
    }

    private async getCompanyInfo(token: string, companyNumber: string): Promise<CompanyDetails> {
        return this.companyService.getCompanyDetails(token, companyNumber);
    }

    private async validateCompanyDetails(token: string, companyDetails: CompanyDetails): Promise<Optional<string>> {
        return this.companyService.validateCompanyDetails(companyDetails, token);
    }

    private updateSession(session: DissolutionSession, company: CompanyDetails): void {
        const updatedSession: DissolutionSession = {
            ...session,
            officerType: company.companyType === ClosableCompanyType.LLP ? OfficerType.MEMBER : OfficerType.DIRECTOR,
            companyNumber: company.companyNumber,
        };
        this.sessionService.setDissolutionSession(this.httpContext.request, updatedSession);
    }
}
