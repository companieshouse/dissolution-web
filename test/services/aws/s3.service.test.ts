import S3 from "aws-sdk/clients/s3"
import { assert } from "chai"
import sinon from "sinon"

import S3Service from "app/services/aws/s3.service"

describe("S3Service", () => {

    let service: S3Service

    let s3: S3

    const BUCKET: string = "some-certificate-bucket"
    const KEY: string = "some-certificate-key.pdf"

    beforeEach(() => {
        s3 = new S3() // have to stub individual methods due to S3 lib structure

        service = new S3Service(s3)
    })

    describe("generateSignedUrl", () => {
        it("should generate a Signed S3 URL using the provided bucket and key and return it", async () => {
            const certificateUrl: string = "http://some-certificate-url"
            const getSignedUrlPromiseStub: sinon.SinonStub = sinon.stub().resolves(certificateUrl)

            s3.getSignedUrlPromise = getSignedUrlPromiseStub

            const result: string = await service.generateSignedUrl(BUCKET, KEY)

            assert.equal(result, certificateUrl)

            assert.isTrue(getSignedUrlPromiseStub.calledOnce)

            const [action, params] = getSignedUrlPromiseStub.args[0]

            assert.equal(action, "getObject")
            assert.equal(params.Bucket, BUCKET)
            assert.equal(params.Key, KEY)
            assert.equal(params.Expires, 120)
        })
    })
})
