import "reflect-metadata"

import { CookieConfig, SessionMiddleware, SessionStore } from "@companieshouse/node-session-handler"
import { createLogger } from "@companieshouse/structured-logging-node"
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger"
import { authMiddleware as commonAuthMiddleware } from "@companieshouse/web-security-node"
import S3 from "aws-sdk/clients/s3"
import axios, { AxiosInstance } from "axios"
import { Container } from "inversify"
import { buildProviderModule } from "inversify-binding-decorators"
import IORedis from "ioredis"
import PiwikConfig from "./models/piwikConfig"

import * as path from "path"
import { LocalesMiddleware, LocalesService } from "@basilest-ch/ch-node-utils"

import { APP_NAME } from "app/constants/app.const"
import AuthMiddleware from "app/middleware/auth.middleware"
import CompanyAuthMiddleware from "app/middleware/companyAuth.middleware"
import SaveUserEmailToLocals from "app/middleware/saveUserEmailToLocals.middleware"
import AuthConfig from "app/models/authConfig"
import Optional from "app/models/optional"
import JwtEncryptionService from "app/services/encryption/jwtEncryption.service"
import SessionService from "app/services/session/session.service"
import TYPES from "app/types"
import { getEnv, getEnvOrDefault, getEnvOrThrow } from "app/utils/env.util"
import UriFactory from "app/utils/uri.factory"

export function initContainer(): Container {
  const container: Container = new Container()

  // Env
  container.bind<string>(TYPES.CDN_HOST).toConstantValue(getEnvOrThrow("CDN_HOST"))
  container.bind<string>(TYPES.CHIPS_PRESENTER_AUTH_URL).toConstantValue(getEnvOrThrow("CHIPS_PRESENTER_AUTH_URL"))
  container.bind<string>(TYPES.CHS_API_KEY).toConstantValue((getEnvOrThrow("CHS_API_KEY")))
  container.bind<string>(TYPES.CHS_COMPANY_PROFILE_API_LOCAL_URL).toConstantValue(getEnvOrThrow("CHS_COMPANY_PROFILE_API_LOCAL_URL"))
  container.bind<string>(TYPES.CHS_URL).toConstantValue(getEnvOrThrow("CHS_URL"))
  container.bind<string>(TYPES.DISSOLUTIONS_API_URL).toConstantValue(getEnvOrThrow("DISSOLUTIONS_API_URL"))
  container.bind<Optional<string>>(TYPES.NODE_ENV).toConstantValue(getEnv("NODE_ENV"))
  container.bind<string>(TYPES.PAYMENTS_API_URL).toConstantValue(getEnvOrThrow("PAYMENTS_API_URL"))
  const piwikConfig: PiwikConfig = {
    url: getEnvOrThrow("PIWIK_URL"),
    siteId: getEnvOrThrow("PIWIK_SITE_ID"),
    landingPageStartGoalId: Number(getEnvOrThrow("PIWIK_LANDING_PAGE_START_GOAL_ID")),
    confirmationPagePDFGoalId: Number(getEnvOrThrow("PIWIK_CONFIRMATION_PAGE_PDF_GOAL_ID")),
    limitedCompanyGoalId: Number(getEnvOrThrow("PIWIK_LIMITED_COMPANY_GOAL_ID")),
    partnershipGoalId: Number(getEnvOrThrow("PIWIK_PARTNERSHIP_GOAL_ID")),
    limitedCompanyConfirmationGoalId: Number(getEnvOrThrow("PIWIK_LIMITED_COMPANY_CONFIRMATION_GOAL_ID")),
    partnershipConfirmationGoalId: Number(getEnvOrThrow("PIWIK_PARTNERSHIP_CONFIRMATION_GOAL_ID")),
    multiDirectorConfirmationGoalId: Number(getEnvOrThrow("PIWIK_MULTI_DIRECTOR_CONFIRMATION_GOAL_ID")),
    singleDirectorConfirmationGoalId: Number(getEnvOrThrow("PIWIK_SINGLE_DIRECTOR_CONFIRMATION_GOAL_ID"))
  }
  container.bind<PiwikConfig>(TYPES.PIWIK_CONFIG).toConstantValue(piwikConfig)

  container.bind<number>(TYPES.PORT).toConstantValue(Number(getEnvOrDefault("PORT", "3000")))

  // Feature toggles
  container.bind<number>(TYPES.PAY_BY_ACCOUNT_FEATURE_ENABLED).toConstantValue(Number(getEnvOrThrow("PAY_BY_ACCOUNT_FEATURE_ENABLED")))

  // AWS
  container.bind<S3>(TYPES.S3).toConstantValue(new S3({ region: getEnvOrThrow("ENV_REGION_AWS") }))

  // Utils
  const logger = createLogger(APP_NAME)
  container.bind<ApplicationLogger>(ApplicationLogger).toConstantValue(logger)
  container.bind<UriFactory>(UriFactory).toConstantValue(new UriFactory())
  container.bind<AxiosInstance>(TYPES.AxiosInstance).toConstantValue(axios.create())

  // Session
  const cookieConfig: CookieConfig = {
    cookieName: getEnvOrThrow("COOKIE_NAME"),
    cookieSecret: getEnvOrThrow("COOKIE_SECRET"),
    cookieDomain: getEnvOrThrow("COOKIE_DOMAIN")
  }
  const sessionStore = new SessionStore(new IORedis(`${getEnvOrThrow("CACHE_SERVER")}`))
  container.bind(SessionStore).toConstantValue(sessionStore)
  container.bind(TYPES.SessionMiddleware).toConstantValue(SessionMiddleware(cookieConfig, sessionStore))

  // User authentication
  container.bind(TYPES.AuthMiddleware).toConstantValue(
    AuthMiddleware(getEnvOrThrow("CHS_URL"), new UriFactory(), commonAuthMiddleware)
  )

  const sessionService: SessionService = new SessionService()

  // Company authentication
  const authConfig: AuthConfig = {
    accountUrl: getEnvOrThrow("ACCOUNT_URL"),
    accountRequestKey: getEnvOrThrow("OAUTH2_REQUEST_KEY"),
    accountClientId: getEnvOrThrow("OAUTH2_CLIENT_ID"),
    chsUrl: getEnvOrThrow("CHS_URL"),
  }
  container.bind(TYPES.CompanyAuthMiddleware).toConstantValue(
    CompanyAuthMiddleware(authConfig, new JwtEncryptionService(authConfig), sessionService, logger)
  )

  container.bind(TYPES.SaveUserEmailToLocals).toConstantValue(
    SaveUserEmailToLocals(sessionService)
  )

  // Locales
  console.log("----------X1------------ inversify")
  LocalesService.getInstance(
      path.join(__dirname, getEnvOrThrow("LOCALES_PATH")),
      Boolean (getEnvOrThrow("LOCALES_ENABLED")))
  container.bind(TYPES.LocalesMiddleware).toConstantValue(LocalesMiddleware())


  container.load(buildProviderModule())

  return container
}

export default initContainer
