import { Session } from 'ch-node-session-handler/lib'
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import sinon from 'sinon'

import DirectorToSign from 'app/models/session/directorToSign.model'
import DissolutionSession from 'app/models/session/dissolutionSession.model'

import { generateEmail } from 'test/fixtures/util.fixtures'

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
    directorsToSign: generateDirectorsToSign()
  }
}

export function generateDirectorsToSign(): DirectorToSign[] {
  return [
    generateDirectorToSign('Ashamed Alligator', '1'),
    generateDirectorToSign('Sympathetic Hippopotamus', '2'),
    generateDirectorToSign('Radical Wombat', '3')
  ]
}

export function generateDirectorToSign(name: string, id: string): DirectorToSign {
  return {
    id,
    name,
    email: generateEmail(name)
  }
}