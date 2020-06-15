import { Session } from 'ch-node-session-handler'
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces'
import sinon from 'sinon'

export function generateSession(): Session {
  return {
    get: sinon.stub(),
    data: {},
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
    }
  }
}
