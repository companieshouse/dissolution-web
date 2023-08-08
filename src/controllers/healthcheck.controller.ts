import { SessionStore } from "@companieshouse/node-session-handler";
import { StatusCodes } from "http-status-codes";
import { inject } from "inversify";
import { controller, httpGet, BaseHttpController } from "inversify-express-utils";

import { HEALTHCHECK_URI } from "app/paths";

@controller(HEALTHCHECK_URI)
export class HealthcheckController extends BaseHttpController {

    public constructor (@inject(SessionStore) private readonly store: SessionStore) {
        super();
    }

    @httpGet('')
    public async healthcheck (): Promise<void> {
        const status: number = await this.isRedisHealthy() ? StatusCodes.OK : StatusCodes.INTERNAL_SERVER_ERROR;

        this.httpContext.response.status(status).send(`Redis status: ${status}`);
    }

    private async isRedisHealthy (): Promise<boolean> {
        try {
            await this.store.redis.ping();
            return true;
        } catch (err) {
            return false;
        }
    }
}
