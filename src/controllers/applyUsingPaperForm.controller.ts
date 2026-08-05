import { StatusCodes } from "http-status-codes";
import { controller, httpGet } from "inversify-express-utils";
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

@controller(`${APPLY_USING_PAPER_FORM_BASE_URI}-directors`)
export class ApplyUsingPaperFormDirectorsController extends BaseController {
    @httpGet("")
    public async get(): Promise<string> {
        return this.renderView(OfficerType.DIRECTOR);
    }

    private async renderView(officerType: OfficerType): Promise<string> {
        const viewModel: ViewModel = {
            backUri: SEARCH_COMPANY_URI,
            officerType,
        };

        return super.render("apply-using-paper-form", viewModel, StatusCodes.OK);
    }
}

@controller(`${APPLY_USING_PAPER_FORM_BASE_URI}-members`)
export class ApplyUsingPaperFormMembersController extends BaseController {
    @httpGet("")
    public async get(): Promise<string> {
        return this.renderView(OfficerType.MEMBER);
    }

    private async renderView(officerType: OfficerType): Promise<string> {
        const viewModel: ViewModel = {
            backUri: SEARCH_COMPANY_URI,
            officerType,
        };

        return super.render("apply-using-paper-form", viewModel, StatusCodes.OK);
    }
}
