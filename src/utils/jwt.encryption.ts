import { randomBytes } from 'crypto'
import { JWE, JWK } from 'node-jose'

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

async function jweEncodeWithNonce(returnUri: string, nonce: string): Promise<string> {
  const payloadObject: AuthPayload = {
    'nonce': nonce,
    'content': returnUri
  }

  const payload = JSON.stringify(payloadObject)
  const decoded = Buffer.from('pXf+qkU6P6SAoY2lKW0FtKMS4PylaNA3pY2sUQxNFDk=', 'base64') // TODO inject variable

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