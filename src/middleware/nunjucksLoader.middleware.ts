import 'reflect-metadata'

import * as express from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import nunjucks from 'nunjucks'
import * as path from 'path'

import PiwikConfig from 'app/models/piwikConfig'
import { ROOT_URI } from 'app/paths'
import TYPES from 'app/types'
import { addFilters, addGlobals } from 'app/utils/nunjucks.util'

@provide(NunjucksLoader)
export default class NunjucksLoader {

  public constructor(
    @inject(TYPES.CDN_HOST) private CDN_HOST: string,
    @inject(TYPES.PIWIK_CONFIG) private PIWIK_CONFIG: PiwikConfig
  ) {}

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

    addFilters(env)
    addGlobals(env)

    this.addLocals(app)
  }

  private addLocals(app: express.Application): void {
    app.locals.cdn = {
      host: this.CDN_HOST
    }

    app.locals.piwik = this.PIWIK_CONFIG

    app.locals.serviceName = 'Apply to strike off and dissolve a company'
  }
}
