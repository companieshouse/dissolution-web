import 'reflect-metadata'

import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'

import DissolutionConfirmation from 'app/models/session/dissolutionConfirmation.model'
import S3Service from 'app/services/aws/s3.service'

@provide(DissolutionCertificateService)
export default class DissolutionCertificateService {

  public constructor(@inject(S3Service) private s3: S3Service) {}

  public async generateDissolutionCertificateUrl(confirmation: DissolutionConfirmation): Promise<string> {
    return this.s3.generateSignedUrl(confirmation.certificateBucket, confirmation.certificateKey)
  }
}
