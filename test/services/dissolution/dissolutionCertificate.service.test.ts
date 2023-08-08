import { assert } from "chai";
import { instance, mock, verify, when } from "ts-mockito";

import DissolutionConfirmation from "app/models/session/dissolutionConfirmation.model";
import S3Service from "app/services/aws/s3.service";
import DissolutionCertificateService from "app/services/dissolution/dissolutionCertificate.service";

import { generateDissolutionConfirmation } from "test/fixtures/session.fixtures";

describe("DissolutionCertificateService", () => {
    let service: DissolutionCertificateService;

    let s3: S3Service;

    const BUCKET: string = "some-certificate-bucket";
    const KEY: string = "some-certificate-key.pdf";

    beforeEach(() => {
        s3 = mock(S3Service);

        service = new DissolutionCertificateService(instance(s3));
    });

    describe("generateDissolutionCertificateUrl", () => {
        it("should generate a Signed S3 URL to download the certificate and return it", async () => {
            const certificateUrl: string = "http://some-certificate-url";
            const confirmation: DissolutionConfirmation = {
                ...generateDissolutionConfirmation(),
                certificateBucket: BUCKET,
                certificateKey: KEY
            };

            when(s3.generateSignedUrl(BUCKET, KEY)).thenResolve(certificateUrl);

            const result: string = await service.generateDissolutionCertificateUrl(confirmation);

            assert.equal(result, certificateUrl);

            verify(s3.generateSignedUrl(BUCKET, KEY)).once();
        });
    });
});
