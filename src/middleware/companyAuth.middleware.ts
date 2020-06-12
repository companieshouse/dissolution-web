import { generateNonce, jweEncodeWithNonce } from 'app/utils/jwt.encryption'
import ApplicationLogger from 'ch-logging/lib/ApplicationLogger'
import { CookieConfig } from 'ch-node-session-handler/lib/config/CookieConfig'
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { NextFunction, Request, RequestHandler, Response } from 'express'

import { ROOT_URI, SELECT_DIRECTOR_URI } from 'app/paths'

export default function CompanyAuthMiddleware(config: CookieConfig,
                                              logger: ApplicationLogger): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    logger.info(req.originalUrl)
    const companyNumber = getCompanyNumberFromPath(req.originalUrl)
    if (companyNumber === '') {
      return next(new Error('No Company Number in URL'))
    }
    const cookieId = req.cookies[config.cookieName]
    if (cookieId) {
      const signInInfo: ISignInInfo = req.session!.get<ISignInInfo>(SessionKey.SignInInfo) || {}
      console.log(req.session)
      console.log(JSON.stringify(req.session, null, 2))
      if (isAuthorisedForCompany(signInInfo, companyNumber)) {
        logger.info(`User is authenticated for ${companyNumber}`)
        return next()
      } else {
        logger.info(`User is not authenticated for ${companyNumber}, redirecting`)
        return res.redirect(ROOT_URI + '/')
        return res.redirect(await getAuthRedirectUri(req, companyNumber))
      }
    } else {
      return next(new Error('No session present for company auth filter'))
    }
  }
}

function isAuthorisedForCompany(signInInfo: ISignInInfo, companyNumber: string): boolean {
  // @ts-ignore
  return signInInfo[SignInInfoKeys.CompanyNumber] === companyNumber
}

function getCompanyNumberFromPath(path: string): string {
  const regexPattern = /company=([0-9a-zA-Z]{8})/

  const found = path.match(regexPattern)
  if (found) {
    return found[0]
  } else {
    return ''
  }
}

async function getAuthRedirectUri(req: Request, companyNumber?: string): Promise<string> {
  const originalUrl = req.originalUrl

  let scope = ''

  if (companyNumber != null) {
    scope = 'chs-dev' + companyNumber
  }

  const session = req.session
  const nonce = generateNonce()
  session!.data[SessionKey.OAuth2Nonce] = nonce
  // await saveSession(session)

  return await createAuthUri(originalUrl, nonce, scope)
}

async function createAuthUri(originalUri: string, nonce: string, scope?: string): Promise<string> {
  let authUri = OAUTH2_AUTH_URI.concat('?',
    'client_id=', OAUTH2_CLIENT_ID,
    '&redirect_uri=', SELECT_DIRECTOR_URI,
    '&response_type=code')

  if (scope != null) {
    authUri = authUri.concat('&scope=', scope)
  }

  authUri = authUri.concat('&state=', await jweEncodeWithNonce(originalUri, nonce, 'content'))
  return authUri
}