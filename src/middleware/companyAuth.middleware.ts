import ApplicationLogger from 'ch-logging/lib/ApplicationLogger'
import { CookieConfig } from 'ch-node-session-handler/lib/config/CookieConfig'
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { NextFunction, Request, RequestHandler, Response } from 'express'

import { generateNonce, jweEncodeWithNonce } from 'app/utils/jwt.encryption'

interface ISignInInfoWithCompanyNumber extends ISignInInfo {
  [SignInInfoKeys.CompanyNumber]?: string
}

const OATH_SCOPE_PREFIX = 'https://api.companieshouse.gov.uk/company/'

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
      console.log(JSON.stringify(req.session, null, 2))
      if (isAuthorisedForCompany(signInInfo, companyNumber)) {
        logger.info(`User is authenticated for ${companyNumber}`)
        return next()
      } else {
        logger.info(`User is not authenticated for ${companyNumber}, redirecting`)
        return res.redirect(
          await getAuthRedirectUri(req, companyNumber))
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

async function getAuthRedirectUri(req: Request, companyNumber?: string): Promise<string> {
  const originalUrl = req.originalUrl

  let scope = ''

  if (companyNumber != null) {
    scope = OATH_SCOPE_PREFIX + companyNumber
  }

  const session = req.session
  const nonce = generateNonce()
  session!.setExtraData(SessionKey.OAuth2Nonce, nonce)
  // await saveSession(session)

  return await createAuthUri(originalUrl, nonce, scope)
}

async function createAuthUri(originalUri: string, nonce: string, scope?: string): Promise<string> {
  let authUri = 'http://account.chs-dev/oauth2/authorise'.concat('?', // TODO inject variable
    'client_id=', '1234567890.apps.ch.gov.uk', // TODO inject variable
    '&redirect_uri=', 'http://chs-dev/oauth2/user/callback',
    '&response_type=code')

  if (scope != null) {
    authUri = authUri.concat('&scope=', scope)
  }

  authUri = authUri.concat('&state=', await jweEncodeWithNonce(originalUri, nonce, 'content'))
  return authUri
}