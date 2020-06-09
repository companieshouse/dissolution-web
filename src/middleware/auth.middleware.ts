import ApplicationLogger from 'ch-logging/lib/ApplicationLogger'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { BaseMiddleware } from 'inversify-express-utils'
import { authMiddleware, AuthOptions } from 'web-security-node'

import { SEARCH_COMPANY_URI } from 'app/paths'
import TYPES from 'app/types'
import { UriFactory } from 'app/utils/uri.factory'

@provide(AuthMiddleware)
export class AuthMiddleware extends BaseMiddleware {

  public constructor(
    @inject(ApplicationLogger) private logger: ApplicationLogger,
    @inject(TYPES.ACCOUNT_WEB_URL) private ACCOUNT_WEB_URL: string,
    @inject(UriFactory) private uriFactory: UriFactory) {
    super()
  }

  private getReturnToPage(req: Request): string {
    return this.uriFactory.createAbsoluteUri(req, SEARCH_COMPANY_URI)
  }

  public handler: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
    const authOptions = {
      returnUrl: this.getReturnToPage(req),
      accountWebUrl: this.ACCOUNT_WEB_URL,
      logger: this.logger
    } as AuthOptions
    authMiddleware(authOptions)(req, res, next)
  }
}