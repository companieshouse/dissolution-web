import "reflect-metadata";

import { Application, RequestHandler } from "express";
import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";

import TYPES from "app/types";
import { COMPANY_PATH_PREFIX } from "app/paths";

@provide(CustomServerMiddlewareLoader)
export default class CustomServerMiddlewareLoader {
    public constructor(
        @inject(TYPES.SessionMiddleware) private readonly sessionMiddleware: RequestHandler,
        @inject(TYPES.SaveUserEmailToLocals) private readonly saveUserEmailToLocals: RequestHandler,
        @inject(TYPES.AuthMiddleware) private readonly authMiddleware: RequestHandler,
        @inject(TYPES.CompanyAuthMiddleware) private readonly companyAuthMiddleware: RequestHandler,
        @inject(TYPES.CompanyNumberAuthMiddleware) private readonly companyNumberAuthMiddleware: RequestHandler,
        @inject(TYPES.TransactionMiddleware) private readonly transactionMiddleware: RequestHandler
    ) {}

    public loadCustomServerMiddleware(app: Application): void {
        app.use(this.sessionMiddleware);
        app.use(this.authMiddleware);
        app.use(this.saveUserEmailToLocals);
        app.use(this.companyAuthMiddleware);
        // providing a route pattern here to enable express to populate the named parameters in Request.params
        // also skips routes without the company path prefix without needing to maintain an allowlist.
        app.use(COMPANY_PATH_PREFIX, this.companyNumberAuthMiddleware);
        // TRANSACTION_PATH_PREFIX is not used here because app.use() does prefix matching: the prefix must be
        // followed by "/" or the end of the URL. TRANSACTION_PATH_PREFIX ends with a required "/" before the
        // optional "(transactions/:transactionId/)?" group, so the next character is always the start of the page
        // name (e.g. "select-director") and the middleware never runs. The controllers are unaffected because their
        // routes match the full URL rather than a prefix.
        app.use(`${COMPANY_PATH_PREFIX}/transactions/:transactionId`, this.transactionMiddleware);
    }
}
