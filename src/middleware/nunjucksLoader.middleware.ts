import 'reflect-metadata'

import * as express from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import nunjucks from 'nunjucks'
import * as path from 'path'

import { asGovUKErrorList } from 'app/filters/asGovUKErrorList.filter'
import Optional from 'app/models/optional'
import { ROOT_URI } from 'app/paths'
import TYPES from 'app/types'

@provide(NunjucksLoader)
export default class NunjucksLoader {

  public constructor(
    @inject(TYPES.CDN_HOST) private CDN_HOST: string,
    @inject(TYPES.PIWIK_URL) private PIWIK_URL: Optional<string>,
    @inject(TYPES.PIWIK_SITE_ID) private PIWIK_SITE_ID: Optional<string>) {}

  public configureNunjucks(app: express.Application, directory: string): void {
    app.use(ROOT_URI, express.static(path.join(directory, '/node_modules/govuk-frontend')))
    app.use(ROOT_URI, express.static(path.join(directory, '/node_modules/govuk-frontend/govuk')))
    app.use('/assets', express.static(path.join(directory, '/assets')))

    app.set('view engine', 'njk')

    const env: nunjucks.Environment = nunjucks.configure(
      [
          'dist/views',
          'node_modules/govuk-frontend',
          'node_modules/govuk-frontend/components',
      ],
      {
        autoescape: true,
        express: app
      }
    )

    this.addFilters(env)

    this.addLocals(app)
  }

  private addFilters(env: nunjucks.Environment): void {
    env.addFilter('asGovUKErrorList', asGovUKErrorList)
  }

  private addLocals(app: express.Application): void {
    app.locals.cdn = {
      host: this.CDN_HOST
    }

    if (this.PIWIK_URL && this.PIWIK_SITE_ID) {
      app.locals.piwik = {
        url: this.PIWIK_URL,
        site: this.PIWIK_SITE_ID
      }
    }
  }
}
