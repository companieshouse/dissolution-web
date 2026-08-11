import { StatusCodes } from "http-status-codes";
import { controller, httpGet } from "inversify-express-utils";
import { inject } from "inversify";

import BaseController from "app/controllers/base.controller";
import { APPLY_USING_PAPER_FORM_URI } from "app/paths";
import OfficerType from "app/models/dto/officerType.enum";
import SessionService from "app/services/session/session.service";

interface ViewModel {
    officerType: string;
}

@controller(APPLY_USING_PAPER_FORM_URI)
export class ApplyUsingPaperFormController extends BaseController {
    public constructor(@inject(SessionService) private readonly session: SessionService) {
        super();
    }

    @httpGet("")
    public async get(): Promise<string> {
        const officerType = this.session.requireOfficerType(this.httpContext.request);
        return this.renderView(officerType);
    }

    private async renderView(officerType: OfficerType): Promise<string> {
        const viewModel: ViewModel = {
            officerType,
        };

        return super.render("apply-using-paper-form", viewModel, StatusCodes.OK);
    }
}
