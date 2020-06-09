import { AuthMiddleware } from 'app/middleware/auth.middleware'
import * as bodyParser from 'body-parser'
import ApplicationLogger from 'ch-logging/lib/ApplicationLogger'
import { SessionMiddleware } from 'ch-node-session-handler'
import { Application, NextFunction, Request, Response } from 'express'
import { Container } from 'inversify'
import { buildProviderModule } from 'inversify-binding-decorators'
import { InversifyExpressServer } from 'inversify-express-utils'
import * as nunjucks from 'nunjucks'
import { anything, instance, mock, when, } from 'ts-mockito'

import { addFilters } from 'app/utils/nunjucks.util'


// tslint:disable-next-line: no-empty
export const createApp = (configureBindings?: (container: Container) => void): Application => {
  const container: Container = new Container()
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
    })
    .build()
}

export const createAppWithFakeSession = (configureBindings?: (container: Container) => void): Application => {
  return createApp(container => {
    const authMiddleware: AuthMiddleware = mock(AuthMiddleware)
    when(authMiddleware.handler(anything(), anything(), anything)).thenCall((_1, _2, next) => {
      console.log('auth middleware hit!')
      next()
    })
    container.rebind(AuthMiddleware).toConstantValue(instance(authMiddleware))

    container.bind(ApplicationLogger).toConstantValue(mock(instance(ApplicationLogger)))
    container.bind(SessionMiddleware).toConstantValue((_1: Request, _2: Response, next: NextFunction) => next())


    configureBindings?.(container)
  })
}