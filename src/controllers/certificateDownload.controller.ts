import { inject } from "inversify";
import { controller, httpGet } from "inversify-express-utils";
import { RedirectResult } from "inversify-express-utils/dts/results";

import BaseController from "app/controllers/base.controller";
import DissolutionConfirmation from "app/models/session/dissolutionConfirmation.model";
import { CERTIFICATE_DOWNLOAD_URI } from "app/paths";
import DissolutionService from "app/services/dissolution/dissolution.service";
import SessionService from "app/services/session/session.service";

@controller(CERTIFICATE_DOWNLOAD_URI)
export class CertificateDownloadController extends BaseController {

    public constructor (
    @inject(SessionService) private session: SessionService,
    @inject(DissolutionService) private dissolutionService: DissolutionService) {
        super();
    }

    @httpGet('')
    public async get (): Promise<RedirectResult> {
        const confirmation: DissolutionConfirmation = this.session.getDissolutionSession(this.httpContext.request)!.confirmation!;

        return super.redirect(await this.dissolutionService.generateDissolutionCertificateUrl(confirmation));
    }
}
