import 'reflect-metadata'

import bodyParser from 'body-parser'
import { createLoggerMiddleware } from 'ch-logging'
import ApplicationLogger from 'ch-logging/lib/ApplicationLogger'
import cookieParser from 'cookie-parser'
import * as express from 'express'
import { INTERNAL_SERVER_ERROR, NOT_FOUND } from 'http-status-codes'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import NunjucksLoader from './nunjucksLoader.middleware'

import { APP_NAME } from 'app/constants/app.const'

@provide(ServerMiddlewareLoader)
export default class ServerMiddlewareLoader {

  public constructor(
    @inject(NunjucksLoader) private nunjucks: NunjucksLoader,
    @inject(ApplicationLogger) private logger: ApplicationLogger) {}

  public loadServerMiddleware(app: express.Application, directory: string): void {
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(cookieParser())
    app.use(createLoggerMiddleware(APP_NAME))

    this.nunjucks.configureNunjucks(app, directory)
  }

  public configureErrorHandling(app: express.Application): void {
    app.use(
      (req: express.Request, res: express.Response) => this.notFoundHandler(req, res),
      (err: any, req: express.Request, res: express.Response) => this.defaultHandler(err, req, res)
    )
  }

  private notFoundHandler(_: express.Request, res: express.Response): void {
    return res.status(NOT_FOUND).render('error')
  }

  private defaultHandler(err: any, _: express.Request, res: express.Response): void {
    this.logger.error(`${err.constructor.name} - ${err.message}`)

    if (!err.statusCode) {
        err.statusCode = INTERNAL_SERVER_ERROR
    }

    return res.status(err.statusCode).render('error')
  }
}
