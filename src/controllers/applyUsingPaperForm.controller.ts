import { StatusCodes } from "http-status-codes";
import { controller, httpGet } from "inversify-express-utils";
import { inject } from "inversify";

import BaseController from "app/controllers/base.controller";
import { APPLY_USING_PAPER_FORM_URI } from "app/paths";
import OfficerType from "app/models/dto/officerType.enum";
import DissolutionSession from "app/models/session/dissolutionSession.model";
import SessionService from "app/services/session/session.service";
import CompanyDetails from "app/models/companyDetails.model";
import ClosableCompanyType from "app/models/mapper/closableCompanyType.enum";
import CompanyService from "app/services/company/company.service";

interface ViewModel {
    officerType: string;
}

@controller(APPLY_USING_PAPER_FORM_URI)
export class ApplyUsingPaperFormController extends BaseController {
    public constructor(
        @inject(SessionService) private session: SessionService,
        @inject(CompanyService) private readonly companyService: CompanyService
    ) {
        super();
    }

    @httpGet("")
    public async get(): Promise<string> {
        let officerType: OfficerType = await this.getOfficerType();
        return this.renderView(officerType);
    }

    private async renderView(officerType: OfficerType): Promise<string> {
        const viewModel: ViewModel = {
            officerType,
        };

        return super.render("apply-using-paper-form", viewModel, StatusCodes.OK);
    }

    private async getOfficerType(): Promise<OfficerType> {
        const session: DissolutionSession = this.session.requireDissolutionSession(this.httpContext.request);
        if (session?.officerType) {
            return session.officerType;
        }

        const token: string = this.session.getAccessToken(this.httpContext.request);
        const companyNumber = this.session.requireDissolutionCompanyNumber(this.httpContext.request);
        const company: CompanyDetails = await this.getCompanyInfo(token, companyNumber);
        return company.companyType === ClosableCompanyType.LLP ? OfficerType.MEMBER : OfficerType.DIRECTOR;
    }

    private async getCompanyInfo(token: string, companyNumber: string): Promise<CompanyDetails> {
        return this.companyService.getCompanyDetails(token, companyNumber);
    }
}
