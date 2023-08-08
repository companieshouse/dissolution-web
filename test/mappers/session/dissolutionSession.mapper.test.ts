import { assert } from "chai";
import "mocha";
import { generateDissolutionGetResponse, generateGetDirector } from "../../fixtures/dissolutionApi.fixtures";

import DissolutionSessionMapper from "app/mappers/session/dissolutionSession.mapper";
import ApplicationType from "app/models/dto/applicationType.enum";
import DissolutionGetDirector from "app/models/dto/dissolutionGetDirector";
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse";
import OfficerType from "app/models/dto/officerType.enum";
import DissolutionApprovalModel from "app/models/form/dissolutionApproval.model";
import DissolutionConfirmation from "app/models/session/dissolutionConfirmation.model";

describe("DissolutionSessionMapper", () => {

    const mapper: DissolutionSessionMapper = new DissolutionSessionMapper();

    describe("mapToApprovalModel", () => {
        let dissolution: DissolutionGetResponse;
        let signatory: DissolutionGetDirector;

        beforeEach(() => {
            dissolution = generateDissolutionGetResponse();
            signatory = generateGetDirector();
        });

        it("should map the company information to the approval model for DS01", () => {
            dissolution.company_name = "some company name";
            dissolution.company_number = "12345";
            dissolution.application_type = ApplicationType.DS01;

            const result: DissolutionApprovalModel = mapper.mapToApprovalModel(dissolution, signatory);

            assert.equal(result.companyName, "some company name");
            assert.equal(result.companyNumber, "12345");
            assert.equal(result.officerType, OfficerType.DIRECTOR);
        });

        it("should map the company information to the approval model for LLDS01", () => {
            dissolution.company_name = "some company name";
            dissolution.company_number = "12345";
            dissolution.application_type = ApplicationType.LLDS01;

            const result: DissolutionApprovalModel = mapper.mapToApprovalModel(dissolution, signatory);

            assert.equal(result.companyName, "some company name");
            assert.equal(result.companyNumber, "12345");
            assert.equal(result.officerType, OfficerType.MEMBER);
        });

        it("should map the signatory information to the approval model", () => {
            signatory.officer_id = "abc123";
            signatory.name = "some signatory name";

            const result: DissolutionApprovalModel = mapper.mapToApprovalModel(dissolution, signatory);

            assert.equal(result.officerId, "abc123");
            assert.equal(result.applicant, "some signatory name");
        });
    });

    describe("mapToDissolutionConfirmation", () => {
        let dissolution: DissolutionGetResponse;

        const BUCKET: string = "some-bucket";
        const KEY: string = "some-key";

        beforeEach(() => dissolution = generateDissolutionGetResponse());

        it("should map the certificate fields to a confirmation session", () => {
            dissolution.certificate_bucket = BUCKET;
            dissolution.certificate_key = KEY;

            const result: DissolutionConfirmation = mapper.mapToDissolutionConfirmation(dissolution);

            assert.equal(result.certificateKey, KEY);
            assert.equal(result.certificateBucket, BUCKET);
        });
    });
});
