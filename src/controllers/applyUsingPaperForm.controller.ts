import { StatusCodes } from "http-status-codes";
import { controller, httpGet } from "inversify-express-utils";
import BaseController from "app/controllers/base.controller";
import { SEARCH_COMPANY_URI, APPLY_USING_PAPER_FORM_BASE_URI } from "app/paths";

interface ViewModel {
    backUri?: string;
    officerType: string;
}

@controller(`${APPLY_USING_PAPER_FORM_BASE_URI}-directors`)
export class ApplyUsingPaperFormDirectorsController extends BaseController {
    public constructor() {
        super();
    }

    @httpGet("")
    public async get(): Promise<string> {
        return this.renderView("director");
    }

    private async renderView(officerType: string): Promise<string> {
        const viewModel: ViewModel = {
            backUri: SEARCH_COMPANY_URI,
            officerType,
        };

        return super.render("apply-using-paper-form", viewModel, StatusCodes.OK);
    }
}

@controller(`${APPLY_USING_PAPER_FORM_BASE_URI}-members`)
export class ApplyUsingPaperFormMembersController extends BaseController {
    public constructor() {
        super();
    }

    @httpGet("")
    public async get(): Promise<string> {
        return this.renderView("member");
    }

    private async renderView(officerType: string): Promise<string> {
        const viewModel: ViewModel = {
            backUri: SEARCH_COMPANY_URI,
            officerType,
        };

        return super.render("apply-using-paper-form", viewModel, StatusCodes.OK);
    }
}
