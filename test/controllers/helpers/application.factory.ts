import axios, { AxiosInstance } from 'axios'
import * as bodyParser from 'body-parser'
import { Application, NextFunction, Request, Response } from 'express'
import { Container } from 'inversify'
import { buildProviderModule } from 'inversify-binding-decorators'
import { InversifyExpressServer } from 'inversify-express-utils'
import * as nunjucks from 'nunjucks'

import TYPES from 'app/types'
import { addFilters, addGlobals } from 'app/utils/nunjucks.util'

export const createApp = (configureBindings?: (container: Container) => void): Application => {
  const container: Container = new Container()

  mockEnvVars(container)
  mockMiddlewares(container)

  container.load(buildProviderModule())
  configureBindings?.(container)

  return new InversifyExpressServer(container)
    .setConfig(server => {

      server.use(bodyParser.json())
      server.use(bodyParser.urlencoded({extended: false}))

      server.set('view engine', 'njk')

      const env: nunjucks.Environment = nunjucks.configure(
        [
          'src/views',
          'node_modules/govuk-frontend',
          'node_modules/govuk-frontend/components',
        ],
        {
          autoescape: true,
          express: server
        }
      )

      addFilters(env)
      addGlobals(env)
    })
    .build()
}

const mockEnvVars = (container: Container): void => {
  container.bind(TYPES.CHS_COMPANY_PROFILE_API_LOCAL_URL).toConstantValue('CHS_COMPANY_PROFILE_API_LOCAL_URL')
  container.bind(TYPES.DISSOLUTIONS_API_URL).toConstantValue('DISSOLUTIONS_API_URL')
  container.bind<AxiosInstance>(TYPES.AxiosInstance).toConstantValue(axios.create())
}

const mockMiddlewares = (container: Container): void => {
  container.bind(TYPES.SessionMiddleware).toConstantValue((_1: Request, _2: Response, next: NextFunction) => next())
  container.bind(TYPES.AuthMiddleware).toConstantValue((_1: Request, _2: Response, next: NextFunction) => next())
  container.bind(TYPES.CompanyAuthMiddleware).toConstantValue((_1: Request, _2: Response, next: NextFunction) => next())
}
