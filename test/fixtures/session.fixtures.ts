import { Session } from "@companieshouse/node-session-handler/lib"
import { SessionKey } from "@companieshouse/node-session-handler/lib/session/keys/SessionKey"
import { ISignInInfo } from "@companieshouse/node-session-handler/lib/session/model/SessionInterfaces"
import sinon from "sinon"

import OfficerType from "app/models/dto/officerType.enum"
import PaymentType from "app/models/dto/paymentType.enum"
import { DirectorToRemind, DirectorToSign } from "app/models/session/directorToSign.model"
import DissolutionConfirmation from "app/models/session/dissolutionConfirmation.model"
import DissolutionSession from "app/models/session/dissolutionSession.model"

export const TOKEN = "some-token"
export const EMAIL = "test@mail.com"

export function generateSession (): Session {
    const session: Session = new Session()

    session.get = sinon.stub()
    session.data = {
        [SessionKey.OAuth2Nonce]: ""
    }
    session.getExtraData = sinon.stub()
    session.setExtraData = sinon.stub()
    session.deleteExtraData = sinon.stub()
    session.verify = sinon.stub()

    return session
}

export function generateISignInInfo (): ISignInInfo {
    return {
        access_token: {
            access_token: "some-token"
        },
        user_profile: {
            email: "some@mail.com"
        }
    }
}

export function generateDissolutionSession (companyNumber: string = "12345678"): DissolutionSession {
    return {
        companyNumber,
        directorsToSign: [
            generateDirectorToSign(),
            generateDirectorToSign(),
            generateDirectorToSign()
        ],
        officerType: OfficerType.DIRECTOR,
        paymentType: PaymentType.CREDIT_DEBIT_CARD,
        remindDirectorList: []
    }
}

export function generateDirectorToSign (): DirectorToSign {
    return {
        id: "123",
        name: "Bob Smith",
        email: "test@mail.com",
        isApplicant: false
    }
}

export function generateDirectorToRemind (): DirectorToRemind {
    return {
        id: "abc123",
        reminderSent: true
    }
}

export function generateDissolutionConfirmation (): DissolutionConfirmation {
    return {
        certificateBucket: "some-bucket",
        certificateKey: "some-key"
    }
}
