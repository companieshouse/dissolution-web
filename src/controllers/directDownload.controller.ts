import { controller, httpGet } from "inversify-express-utils";

import BaseController from "app/controllers/base.controller";
import { DIRECT_CERTIFICATE_DOWNLOAD_URI, COMPANY_LOOKUP_DOWNLOAD } from "app/paths";
import { RedirectResult } from "inversify-express-utils/lib/results";

@controller(DIRECT_CERTIFICATE_DOWNLOAD_URI)
export class DirectDownloadController extends BaseController {
    @httpGet("")
    public async get(): Promise<RedirectResult> {
        return this.redirect(COMPANY_LOOKUP_DOWNLOAD);
    }
}
