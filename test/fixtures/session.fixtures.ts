import { Session } from 'ch-node-session-handler/lib'
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import sinon from 'sinon'

import OfficerType from 'app/models/dto/officerType.enum'
import DirectorToSign from 'app/models/session/directorToSign.model'
import DissolutionConfirmation from 'app/models/session/dissolutionConfirmation.model'
import DissolutionSession from 'app/models/session/dissolutionSession.model'

export function generateSession(): Session {
  return {
    get: sinon.stub(),
    data: {
      [SessionKey.OAuth2Nonce]: ''
    },
    getExtraData: sinon.stub(),
    setExtraData: sinon.stub(),
    deleteExtraData: sinon.stub(),
    verify: sinon.stub()
  }
}

export function generateISignInInfo(): ISignInInfo {
  return {
    access_token: {
      access_token: 'some-token'
    },
    user_profile: {
      email: 'some@mail.com'
    }
  }
}

export function generateDissolutionSession(companyNumber: string = '12345678'): DissolutionSession {
  return {
    companyNumber,
    directorsToSign: [
      generateDirectorToSign(),
      generateDirectorToSign(),
      generateDirectorToSign()
    ],
    officerType: OfficerType.DIRECTOR
  }
}

export function generateDirectorToSign(): DirectorToSign {
  return {
    id: '123',
    name: 'Bob Smith',
    email: 'test@mail.com',
    isApplicant: false
  }
}

export function generateDissolutionConfirmation(): DissolutionConfirmation {
  return {
    certificateBucket: 'some-bucket',
    certificateKey: 'some-key'
  }
}
