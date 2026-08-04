import { StatusCodes } from "http-status-codes";
import { controller, httpGet } from "inversify-express-utils";
import BaseController from "app/controllers/base.controller";
import { SEARCH_COMPANY_URI } from "app/paths";

interface ViewModel {
    backUri?: string;
    officerType: string;
}

@controller("")
export class ApplyUsingPaperFormDirectorsController extends BaseController {
    public constructor() {
        super();
    }

    @httpGet("/close-a-company/apply-using-paper-form-directors")
    public async getDirectors(): Promise<string> {
        return this.renderView("director");
    }

    @httpGet("/close-a-company/apply-using-paper-form-members")
    public async getMembers(): Promise<string> {
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
