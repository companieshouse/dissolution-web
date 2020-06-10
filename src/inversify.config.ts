import 'reflect-metadata'

import { createLogger } from 'ch-logging'
import ApplicationLogger from 'ch-logging/lib/ApplicationLogger'
import { CookieConfig, SessionMiddleware, SessionStore } from 'ch-node-session-handler'
import { Container } from 'inversify'
import { buildProviderModule } from 'inversify-binding-decorators'
import IORedis from 'ioredis'
import { authMiddleware as commonAuthMiddleware } from 'web-security-node'

import { APP_NAME } from 'app/constants/app.const'
import AuthMiddleware from 'app/middleware/auth.middleware'
import Optional from 'app/models/optional'
import TYPES from 'app/types'
import { getEnv, getEnvOrDefault, getEnvOrThrow } from 'app/utils/env.util'
import UriFactory from 'app/utils/uri.factory'

export function initContainer(): Container {
  const container: Container = new Container()

  // Env
  container.bind<number>(TYPES.PORT).toConstantValue(Number(getEnvOrDefault('PORT', '3000')))
  container.bind<Optional<string>>(TYPES.NODE_ENV).toConstantValue(getEnv('NODE_ENV'))
  container.bind<string>(TYPES.CDN_HOST).toConstantValue(getEnvOrThrow('CDN_HOST'))
  container.bind<Optional<string>>(TYPES.PIWIK_SITE_ID).toConstantValue(getEnv('PIWIK_SITE_ID'))
  container.bind<Optional<string>>(TYPES.PIWIK_URL).toConstantValue(getEnv('PIWIK_URL'))

  // Utils
  container.bind<ApplicationLogger>(ApplicationLogger).toConstantValue(createLogger(APP_NAME))
  container.bind<UriFactory>(UriFactory).toConstantValue(new UriFactory())

  // Session
  const config: CookieConfig = {
    cookieName: getEnvOrThrow('COOKIE_NAME'),
    cookieSecret: getEnvOrThrow('COOKIE_SECRET'),
  }
  const sessionStore = new SessionStore(new IORedis(`${getEnvOrThrow('CACHE_SERVER')}`))
  container.bind(SessionStore).toConstantValue(sessionStore)
  container.bind(TYPES.SessionMiddleware).toConstantValue(SessionMiddleware(config, sessionStore))
  container.bind(TYPES.AuthMiddleware).toConstantValue(AuthMiddleware(
    getEnvOrThrow('CHS_URL'),
    new UriFactory(),
    commonAuthMiddleware
  ))

  container.load(buildProviderModule())

  return container
}

export default initContainer

