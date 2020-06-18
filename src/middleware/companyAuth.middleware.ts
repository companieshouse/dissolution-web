import ApplicationLogger from 'ch-logging/lib/ApplicationLogger'
import { Session } from 'ch-node-session-handler'
import { CookieConfig } from 'ch-node-session-handler/lib/config/CookieConfig'
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { NextFunction, Request, RequestHandler, Response } from 'express'

import { Mutable } from 'app/models/mutable'
import { generateNonce, jweEncodeWithNonce } from 'app/utils/jwt.encryption'

export interface AuthConfig {
  accountUrl: string,
  accountRequestKey: string,
  accountClientId: string,
  chsUrl: string,
}

interface ISignInInfoWithCompanyNumber extends ISignInInfo {
  [SignInInfoKeys.CompanyNumber]?: string
}

const OATH_SCOPE_PREFIX = 'https://api.companieshouse.gov.uk/company/'

export default function CompanyAuthMiddleware(config: CookieConfig, authConfig: AuthConfig,
                                              logger: ApplicationLogger): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const companyNumber = getCompanyNumberFromPath(req.originalUrl)
    if (companyNumber === '') {
      return next(new Error('No Company Number in URL'))
    }
    const cookieId = req.cookies[config.cookieName]
    if (cookieId) {
      const signInInfo: ISignInInfo = req.session!.get<ISignInInfo>(SessionKey.SignInInfo) || {}
      if (isAuthorisedForCompany(signInInfo, companyNumber)) {
        logger.info(`User is authenticated for ${companyNumber}`)
        return next()
      } else {
        logger.info(`User is not authenticated for ${companyNumber}, redirecting`)
        return res.redirect(
          await getAuthRedirectUri(req, authConfig, companyNumber))
      }
    } else {
      return next(new Error('No session present for company auth filter'))
    }
  }
}

function isAuthorisedForCompany(signInInfo: ISignInInfoWithCompanyNumber, companyNumber: string): boolean {
  return signInInfo[SignInInfoKeys.CompanyNumber] === companyNumber
}

function getCompanyNumberFromPath(path: string): string {
  const regexPattern = /company=([0-9a-zA-Z]{8})/

  const found = path.match(regexPattern)
  if (found) {
    return found[1]
  } else {
    return ''
  }
}

async function getAuthRedirectUri(req: Request, authConfig: AuthConfig, companyNumber?: string,): Promise<string> {
  const originalUrl = req.originalUrl

  let scope = ''

  if (companyNumber != null) {
    scope = OATH_SCOPE_PREFIX + companyNumber
  }
  const nonce = generateNonce()

  const mutableSession = req.session as Mutable<Session>
  mutableSession.data[SessionKey.OAuth2Nonce] = nonce
  req.session = mutableSession as Session

  return await createAuthUri(originalUrl, nonce, authConfig, scope)
}

async function createAuthUri(originalUri: string, nonce: string,
                             authConfig: AuthConfig, scope?: string): Promise<string> {
  let authUri = `${authConfig.accountUrl}/oauth2/authorise`.concat('?',
    'client_id=', `${authConfig.accountClientId}`,
    '&redirect_uri=', `${authConfig.chsUrl}/oauth2/user/callback`,
    '&response_type=code')

  if (scope != null) {
    authUri = authUri.concat('&scope=', scope)
  }

  authUri = authUri.concat('&state=', await jweEncodeWithNonce(originalUri, nonce, authConfig))
  return authUri
}