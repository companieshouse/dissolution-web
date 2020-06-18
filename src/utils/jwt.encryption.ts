import { randomBytes } from 'crypto'
import { JWE, JWK } from 'node-jose'

import { AuthConfig } from 'app/middleware/companyAuth.middleware'

/**
 * Implementation referenced from
 * https://github.com/companieshouse/web-security-java
 */

interface AuthPayload {
  nonce: string,
  content: string
}

function generateNonce(): string {
  const bytes = randomBytes(5)
  const buffer = Buffer.from(bytes)
  return buffer.toString('base64')
}

async function jweEncodeWithNonce(returnUri: string, nonce: string, authConfig: AuthConfig): Promise<string> {
  const payloadObject: AuthPayload = {
    'nonce': nonce,
    'content': returnUri
  }

  const payload = JSON.stringify(payloadObject)
  const decoded = Buffer.from(`${authConfig.accountRequestKey}`, 'base64')

  const ks = await JWK.asKeyStore([{
    alg: 'A128CBC-HS256',
    k: decoded,
    kid: 'key',
    kty: 'oct',
    use: 'enc',
  }])

  const key = await JWK.asKey(ks.get('key'))

  return await JWE.createEncrypt({
    format: 'compact',
    fields: {
      alg: 'dir',
      enc: 'A128CBC-HS256'
    }
  }, key).update(payload).final()
}

export { jweEncodeWithNonce, generateNonce }