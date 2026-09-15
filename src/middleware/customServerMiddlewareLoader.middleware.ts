import "reflect-metadata";

import { Application, RequestHandler } from "express";
import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";

import TYPES from "app/types";
import { COMPANY_PATH_PREFIX } from "app/paths";

@provide(CustomServerMiddlewareLoader)
export default class CustomServerMiddlewareLoader {
    public constructor(
        @inject(TYPES.SessionMiddleware) private sessionMiddleware: RequestHandler,
        @inject(TYPES.SaveUserEmailToLocals) private saveUserEmailToLocals: RequestHandler,
        @inject(TYPES.AuthMiddleware) private authMiddleware: RequestHandler,
        @inject(TYPES.CompanyAuthMiddleware) private companyAuthMiddleware: RequestHandler,
        @inject(TYPES.CompanyNumberAuthMiddleware) private companyNumberAuthMiddleware: RequestHandler
    ) {}

    public loadCustomServerMiddleware(app: Application): void {
        app.use(this.sessionMiddleware);
        app.use(this.authMiddleware);
        app.use(this.saveUserEmailToLocals);
        app.use(this.companyAuthMiddleware);
        // providing a route pattern here to enable express to populate the named parameters in Request.params
        // also skips routes without the company path prefix without needing to maintain an allowlist.
        app.use(COMPANY_PATH_PREFIX, this.companyNumberAuthMiddleware);
    }
}
