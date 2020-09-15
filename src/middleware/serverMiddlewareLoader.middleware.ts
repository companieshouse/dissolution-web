import 'reflect-metadata'

import bodyParser from 'body-parser'
import { createLoggerMiddleware } from 'ch-logging'
import ApplicationLogger from 'ch-logging/lib/ApplicationLogger'
import cookieParser from 'cookie-parser'
import { Application, NextFunction, Request, RequestHandler, Response } from 'express'
import { INTERNAL_SERVER_ERROR } from 'http-status-codes'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import NunjucksLoader from './nunjucksLoader.middleware'

import { APP_NAME } from 'app/constants/app.const'
import TYPES from 'app/types'

@provide(ServerMiddlewareLoader)
export default class ServerMiddlewareLoader {

  public constructor(
    @inject(NunjucksLoader) private nunjucks: NunjucksLoader,
    @inject(ApplicationLogger) private logger: ApplicationLogger,
    @inject(TYPES.SessionMiddleware) private sessionMiddleware: RequestHandler,
    @inject(TYPES.SaveUserEmailToLocals) private saveUserEmailToLocals: RequestHandler
  ) {}

  public loadServerMiddleware(app: Application, directory: string): void {
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(cookieParser())
    app.use(createLoggerMiddleware(APP_NAME))

    app.use(this.sessionMiddleware)
    app.use(this.saveUserEmailToLocals)

    this.nunjucks.configureNunjucks(app, directory)
  }

  public configureErrorHandling(app: Application): void {
    app.use((err: any, _: Request, res: Response, _2: NextFunction) => {
      this.logger.error(`${err.constructor.name} - ${err.message}`)

      return res.status(err.statusCode || INTERNAL_SERVER_ERROR).render('error')
    })
  }
}
