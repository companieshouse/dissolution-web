import ApplicationLogger from 'ch-logging/lib/ApplicationLogger'
import { Session } from 'ch-node-session-handler'
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import { NextFunction, Request, RequestHandler, Response } from 'express'

import { DISSOLUTION_SESSION_KEY } from 'app/constants/app.const'
import { Mutable } from 'app/models/mutable'
import Optional from 'app/models/optional'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { JwtEncryptionService } from 'app/services/encryption/jwtEncryption.service'

export interface AuthConfig {
  accountUrl: string,
  accountRequestKey: string,
  accountClientId: string,
  chsUrl: string,
}

const OATH_SCOPE_PREFIX = 'https://api.companieshouse.gov.uk/company/'

export default function CompanyAuthMiddleware(authConfig: AuthConfig,
                                              encryptionService: JwtEncryptionService,
                                              logger: ApplicationLogger): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
      const dissolutionSession: Optional<DissolutionSession> = req.session!.getExtraData(DISSOLUTION_SESSION_KEY)
      if (!dissolutionSession?.companyNumber) {
        return next(new Error('No Company Number in session'))
      }
      const companyNumber: Optional<string> = dissolutionSession!.companyNumber
      const signInInfo: ISignInInfo = req.session!.get<ISignInInfo>(SessionKey.SignInInfo) || {}
      if (isAuthorisedForCompany(signInInfo, companyNumber)) {
        logger.info(`User is authenticated for ${companyNumber}`)
        return next()
      } else {
        logger.info(`User is not authenticated for ${companyNumber}, redirecting`)
        return res.redirect(
          await getAuthRedirectUri(req, authConfig, encryptionService, companyNumber))
      }
  }
}

function isAuthorisedForCompany(signInInfo: ISignInInfo, companyNumber: string): boolean {
  return signInInfo[SignInInfoKeys.CompanyNumber] === companyNumber
}

async function getAuthRedirectUri(req: Request, authConfig: AuthConfig,
                                  encryptionService: JwtEncryptionService, companyNumber?: string): Promise<string> {
  const originalUrl = req.originalUrl

  const scope = OATH_SCOPE_PREFIX + companyNumber

  const nonce = encryptionService.generateNonce()
  const encodedNonce = await encryptionService.jweEncodeWithNonce(originalUrl, nonce)

  const mutableSession = req.session as Mutable<Session>
  mutableSession.data[SessionKey.OAuth2Nonce] = nonce
  req.session = mutableSession as Session

  return await createAuthUri(encodedNonce, authConfig, scope)
}

async function createAuthUri(encodedNonce: string,
                             authConfig: AuthConfig, scope: string): Promise<string> {
  let authUri = `${authConfig.accountUrl}/oauth2/authorise`.concat('?',
    'client_id=', `${authConfig.accountClientId}`,
    '&redirect_uri=', `${authConfig.chsUrl}/oauth2/user/callback`,
    '&response_type=code')

  authUri = authUri
    .concat('&scope=', scope)
    .concat('&state=', encodedNonce)
  return authUri
}