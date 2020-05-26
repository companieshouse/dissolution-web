import { SessionStore } from 'ch-node-session-handler'
import { INTERNAL_SERVER_ERROR, OK } from 'http-status-codes'
import { inject } from 'inversify'
import { controller, httpGet, BaseHttpController } from 'inversify-express-utils'

import { HEALTHCHECK_URI } from 'app/paths'

@controller(HEALTHCHECK_URI)
export class HealthcheckController extends BaseHttpController {

  public constructor(@inject(SessionStore) private readonly store: SessionStore) {
    super()
  }

  @httpGet('')
  public async healthcheck(): Promise<void> {
    const status: number = await this.isRedisHealthy() ? OK : INTERNAL_SERVER_ERROR

    this.httpContext.response.status(status).send(`Redis status: ${status}`)
  }

  private async isRedisHealthy(): Promise<boolean> {
    try {
      await this.store.redis.ping()
      return true
    } catch (err) {
      return false
    }
  }
}
