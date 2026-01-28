import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { assert } from "chai"
import sinon from "sinon"
import S3Service from "app/services/aws/s3.service"

describe("S3Service", () => {
    let s3: S3Client
    let service: S3Service

    const BUCKET: string = "some-certificate-bucket"
    const KEY: string = "some-certificate-key.pdf"
    let getSignedUrlStub: sinon.SinonStub

    beforeEach(() => {
        getSignedUrlStub = sinon.stub(require("@aws-sdk/s3-request-presigner"), "getSignedUrl")
        s3 = new S3Client({})
        service = new S3Service(s3)
    })

    afterEach(() => {
        sinon.restore()
    })

    it("should generate a Signed S3 URL using the provided bucket and key and return it", async () => {

        const signedUrl = "http://some-certificate-url"
        getSignedUrlStub.resolves(signedUrl)

        const result = await service.generateSignedUrl(BUCKET, KEY)

        const getObjectCommandInput = getSignedUrlStub.firstCall.args[1].input

        assert.strictEqual(getObjectCommandInput.Bucket, BUCKET)
        assert.strictEqual(getObjectCommandInput.Key, KEY)
        assert.strictEqual(getSignedUrlStub.firstCall.args[2].expiresIn, 120)

        assert.strictEqual(result, signedUrl)
        assert.isTrue(getSignedUrlStub.calledOnce)
        assert.instanceOf(getSignedUrlStub.firstCall.args[1], GetObjectCommand)
    })

})
