import 'reflect-metadata'

import S3 from 'aws-sdk/clients/s3'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'

import TYPES from 'app/types'

interface SignedUrlParams {
  Bucket: string
  Key: string
  Expires: number
}

@provide(S3Service)
export default class S3Service {

  private readonly SIGNED_URL_EXPIRY_MINS: number = 60 * 2

  public constructor(@inject(TYPES.S3) private s3: S3) {}

  public async generateSignedUrl(bucket: string, key: string): Promise<string> {
    const params: SignedUrlParams = {
      Bucket: bucket,
      Key: key,
      Expires: this.SIGNED_URL_EXPIRY_MINS
    }

    return this.s3.getSignedUrlPromise('getObject', params)
  }
}
