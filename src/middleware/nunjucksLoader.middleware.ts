import "reflect-metadata";

import * as express from "express";
import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";
import nunjucks from "nunjucks";
import * as path from "path";

import { BANNER_FEEDBACK_LINK, CONFIRMATION_FEEDBACK_LINK, PAGE_TITLE_SUFFIX, SERVICE_NAME } from "app/constants/app.const";
import PiwikConfig from "app/models/piwikConfig";
import { ROOT_URI } from "app/paths";
import TYPES from "app/types";
import { addFilters, addGlobals } from "app/utils/nunjucks.util";

@provide(NunjucksLoader)
export default class NunjucksLoader {

    public constructor (
    @inject(TYPES.CDN_HOST) private CDN_HOST: string,
    @inject(TYPES.CHS_URL) private CHS_URL: string,
    @inject(TYPES.PIWIK_CONFIG) private PIWIK_CONFIG: PiwikConfig,
    @inject(TYPES.PAY_BY_ACCOUNT_FEATURE_ENABLED) private PAY_BY_ACCOUNT_FEATURE_ENABLED: number
    ) {}

    public configureNunjucks (app: express.Application, directory: string, nonce: string): void {
        app.use(ROOT_URI, express.static(path.join(directory, "/node_modules/govuk-frontend")));
        app.use(ROOT_URI, express.static(path.join(directory, "/node_modules/govuk-frontend/govuk")));
        app.use("/assets", express.static(path.join(directory, "/assets")));

        app.set("view engine", "njk");

        const env: nunjucks.Environment = nunjucks.configure(
            [
                "dist/views",
                "node_modules/govuk-frontend",
                "node_modules/govuk-frontend/components"
            ],
            {
                autoescape: true,
                express: app
            }
        );

        addFilters(env);
        addGlobals(env);

        this.addLocals(app, nonce);
    }

    private addLocals (app: express.Application, nonce: string): void {
        app.locals.cdn = {
            host: this.CDN_HOST
        };

        app.locals.chs = {
            url: this.CHS_URL
        };

        app.locals.piwik = this.PIWIK_CONFIG;

        app.locals.serviceName = SERVICE_NAME;

        app.locals.pageTitleSuffix = PAGE_TITLE_SUFFIX;

        app.locals.nonce = nonce;

        app.locals.payByAccountFeatureEnabled = this.PAY_BY_ACCOUNT_FEATURE_ENABLED;

        app.locals.bannerFeedbackLink = BANNER_FEEDBACK_LINK;

        app.locals.confirmationFeedbackLink = CONFIRMATION_FEEDBACK_LINK;
    }
}
