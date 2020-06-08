import ApplicationLogger from 'ch-logging/lib/ApplicationLogger';
import { NextFunction, Request, RequestHandler, Response } from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { BaseMiddleware } from 'inversify-express-utils'
import { authMiddleware, AuthOptions } from 'web-security-node'

import { SEARCH_COMPANY_URI } from 'app/paths'
import { getEnvOrDefault } from 'app/utils/env.util'
import { newUriFactory } from 'app/utils/uri.factory'

@provide(AuthMiddleware)
export class AuthMiddleware extends BaseMiddleware {

    public constructor(@inject(ApplicationLogger) private logger: ApplicationLogger) {
        super()
    }

    public getReturnToPage(req: Request): string {
        return newUriFactory(req).createAbsoluteUri(SEARCH_COMPANY_URI)
    }

    public handler: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
        const authOptions = {
            returnUrl: this.getReturnToPage(req),
            accountWebUrl: getEnvOrDefault('ACCOUNT_WEB_URL', ''),
            logger: this.logger
        } as AuthOptions
        authMiddleware(authOptions)(req, res, next)
    }
}