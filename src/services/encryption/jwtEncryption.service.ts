import "reflect-metadata"

import { randomBytes } from "crypto"
import { provide } from "inversify-binding-decorators"
import { JWE, JWK } from "node-jose"

import AuthConfig from "app/models/authConfig"

interface AuthPayload {
  nonce: string,
  content: string
}

@provide(JwtEncryptionService)
export default class JwtEncryptionService {
    public constructor (private authConfig: AuthConfig) {}

    public generateNonce (): string {
        const bytes = randomBytes(5)
        const buffer = Buffer.from(bytes)
        return buffer.toString("base64")
    }

    public async jweEncodeWithNonce (returnUri: string, nonce: string): Promise<string> {
        const payloadObject: AuthPayload = {
            nonce,
            content: returnUri
        }

        const payload = JSON.stringify(payloadObject)
        const decoded = Buffer.from(`${this.authConfig.accountRequestKey}`, "base64")

        const ks = await JWK.asKeyStore([{
            alg: "A128CBC-HS256",
            k: decoded,
            kid: "key",
            kty: "oct",
            use: "enc"
        }])

        const key = await JWK.asKey(ks.get("key"))

        return JWE.createEncrypt({
            format: "compact",
            fields: {
                alg: "dir",
                enc: "A128CBC-HS256"
            }
        }, key).update(payload).final()
    }
}
