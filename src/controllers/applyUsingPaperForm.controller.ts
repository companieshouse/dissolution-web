import { StatusCodes } from "http-status-codes";
import { controller, httpGet } from "inversify-express-utils";
import { inject } from "inversify";

import BaseController from "app/controllers/base.controller";
import { APPLY_USING_PAPER_FORM_URI } from "app/paths";
import OfficerType from "app/models/dto/officerType.enum";
import DissolutionSession from "app/models/session/dissolutionSession.model";
import SessionService from "app/services/session/session.service";
import CompanyService from "app/services/company/company.service";
import Optional from "app/models/optional";

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
        let officerType: OfficerType = OfficerType.DIRECTOR;
        if (this.httpContext.request.session) {
            const session: Optional<DissolutionSession> = this.session.getDissolutionSession(this.httpContext.request);
            if (session?.officerType) {
                officerType = session.officerType;
            }
        }
        return officerType;
    }
}
