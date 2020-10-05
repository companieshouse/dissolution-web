import 'reflect-metadata'

import { Application, RequestHandler } from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'

import TYPES from 'app/types'

@provide(CustomServerMiddlewareLoader)
export default class CustomServerMiddlewareLoader {

  public constructor(
    @inject(TYPES.SessionMiddleware) private sessionMiddleware: RequestHandler,
    @inject(TYPES.SaveUserEmailToLocals) private saveUserEmailToLocals: RequestHandler,
    @inject(TYPES.AuthMiddleware) private authMiddleware: RequestHandler,
    @inject(TYPES.CompanyAuthMiddleware) private companyAuthMiddleware: RequestHandler
  ) {}

  public loadCustomServerMiddleware(app: Application): void {
    app.use(this.sessionMiddleware)
    app.use(this.saveUserEmailToLocals)

    app.use(this.authMiddleware)
    app.use(this.companyAuthMiddleware)
  }
}
