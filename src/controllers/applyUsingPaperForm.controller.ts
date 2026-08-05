import { StatusCodes } from "http-status-codes";
import { controller, httpGet, requestParam } from "inversify-express-utils";
import BaseController from "app/controllers/base.controller";
import { SEARCH_COMPANY_URI, APPLY_USING_PAPER_FORM_BASE_URI } from "app/paths";

enum OfficerType {
    DIRECTOR = "director",
    MEMBER = "member",
}

interface ViewModel {
    backUri?: string;
    officerType: string;
}

@controller(`${APPLY_USING_PAPER_FORM_BASE_URI}-:companyType`)
export class ApplyUsingPaperFormController extends BaseController {
    @httpGet("")
    public async get(@requestParam("companyType") companyType: string): Promise<string> {
        const officerType = companyType === "members" ? OfficerType.MEMBER : OfficerType.DIRECTOR;
        return this.renderView(officerType);
    }

    private async renderView(officerType: OfficerType): Promise<string> {
        const viewModel: ViewModel = {
            backUri: SEARCH_COMPANY_URI,
            officerType,
        };

        return super.render("apply-using-paper-form", viewModel, StatusCodes.OK);
    }
}
