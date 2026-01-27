import "reflect-metadata"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { inject } from "inversify"
import { provide } from "inversify-binding-decorators"

import TYPES from "app/types"

@provide(S3Service)
export default class S3Service {

    private readonly SIGNED_URL_EXPIRY_MINS: number = 60 * 2

    public constructor (@inject(TYPES.S3) private readonly s3: S3Client) {}

    public async generateSignedUrl (bucket: string, key: string): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key
        })

        return await getSignedUrl(this.s3, command, {
            expiresIn: this.SIGNED_URL_EXPIRY_MINS
        })
    }
}
