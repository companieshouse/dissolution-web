import { Session } from 'ch-node-session-handler/lib'
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import sinon from 'sinon'

import DirectorToSign from 'app/models/session/directorToSign.model'
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
    directorsToSign: generateDirectorsToSign()
  }
}

export function generateDirectorsToSign(): DirectorToSign[] {
  return [
    {id: '1', name: 'Ashamed Alligator', email: 'ashameda@company.com'},
    {id: '2', name: 'Sympathetic Hippopotamus', email: 'sympathetich@company.com'},
    {id: '3', name: 'Radical Wombat', email: 'radicalw@company.com', onBehalfName: 'Mysterious Boar'}
  ]
}
