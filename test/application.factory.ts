import * as bodyParser from 'body-parser'
import { Application } from 'express'
import { Container } from 'inversify'
import { buildProviderModule } from 'inversify-binding-decorators'
import { InversifyExpressServer } from 'inversify-express-utils'
import { Environment } from 'nunjucks'
import * as nunjucks from 'nunjucks'

import { asGovUKErrorList } from 'app/filters/asGovUKErrorList.filter'

function addFilters(env: Environment): void {
  env.addFilter('asGovUKErrorList', asGovUKErrorList)
}

// tslint:disable-next-line: no-empty
export const createApp = (configureBindings: (container: Container) => void = () => {
}): Application => {
  const container: Container = new Container()
  container.load(buildProviderModule())
  configureBindings(container)

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