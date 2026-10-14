import { assert } from "chai";
import { anything, capture, instance, mock, verify, when } from "ts-mockito";
import { generateWillSignChangeDetailsFormModel } from "test/fixtures/companyOfficers.fixtures";
import { TOKEN } from "test/fixtures/session.fixtures";

import DissolutionDirectorMapper from "app/mappers/dissolution/dissolutionDirector.mapper";
import DissolutionDirectorPatchRequest from "app/models/dto/dissolutionDirectorPatchRequest";
import DissolutionGetDirector from "app/models/dto/dissolutionGetDirector";
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse";
import ChangeDetailsFormModel from "app/models/form/changeDetails.model";
import DissolutionSession from "app/models/session/dissolutionSession.model";
import { DissolutionApiClient } from "app/services/clients/dissolutionApi.client";
import DissolutionService from "app/services/dissolution/dissolution.service";
import DissolutionDirectorService from "app/services/dissolution/dissolutionDirector.service";

import {
    generateDissolutionDirectorPatchRequest,
    generateDissolutionGetResponse,
    generateGetDirector,
} from "test/fixtures/dissolutionApi.fixtures";
import { generateDissolutionSession } from "test/fixtures/session.fixtures";
import SessionService from "app/services/session/session.service";

describe("DissolutionDirectorService", () => {
    let service: DissolutionDirectorService;

    let dissolutionService: DissolutionService;
    let mapper: DissolutionDirectorMapper;
    let client: DissolutionApiClient;
    let sessionService: SessionService;

    beforeEach(() => {
        dissolutionService = mock(DissolutionService);
        mapper = mock(DissolutionDirectorMapper);
        client = mock(DissolutionApiClient);
        sessionService = mock(SessionService);

        service = new DissolutionDirectorService(
            instance(dissolutionService),
            instance(mapper),
            instance(client),
            instance(sessionService)
        );
    });

    describe("getSignatoryToEdit", () => {
        const SIGNATORY_1_ID = "abc123";
        const SIGNATORY_2_ID = "def456";

        let dissolutionSession: DissolutionSession;
        let dissolution: DissolutionGetResponse;

        beforeEach(() => {
            dissolutionSession = generateDissolutionSession();
            dissolution = generateDissolutionGetResponse();
        });

        it("should fetch the dissolution and reject an error if the signatory is session cannot be found", async () => {
            dissolution.directors = [{ ...generateGetDirector(), officer_id: SIGNATORY_1_ID }];
            dissolutionSession.signatoryIdToEdit = SIGNATORY_2_ID;

            when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);

            try {
                await service.getSignatoryToEdit(TOKEN, dissolutionSession);
                assert.fail();
            } catch (err) {
                assert.equal(err, "Error: Signatory in session not present on dissolution");
            }
        });

        it("should fetch the dissolution and return the matching signatory to edit", async () => {
            const signatory1: DissolutionGetDirector = { ...generateGetDirector(), officer_id: SIGNATORY_1_ID };
            const signatory2: DissolutionGetDirector = { ...generateGetDirector(), officer_id: SIGNATORY_2_ID };

            dissolution.directors = [signatory1, signatory2];
            dissolutionSession.signatoryIdToEdit = SIGNATORY_2_ID;

            when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);

            const result: DissolutionGetDirector = await service.getSignatoryToEdit(TOKEN, dissolutionSession);

            assert.equal(result, signatory2);
        });
    });

    describe("updateSignatory", () => {
        const COMPANY_NUMBER = "0177777";
        const TRANSACTION_ID = "111111-222222-333333";
        const SIGNATORY_ID = "abc123";

        let dissolutionSession: DissolutionSession;
        let form: ChangeDetailsFormModel;
        let body: DissolutionDirectorPatchRequest;

        beforeEach(() => {
            dissolutionSession = generateDissolutionSession();
            dissolutionSession.companyNumber = COMPANY_NUMBER;
            dissolutionSession.signatoryIdToEdit = SIGNATORY_ID;

            form = generateWillSignChangeDetailsFormModel();
            body = generateDissolutionDirectorPatchRequest();

            when(sessionService.getAccessToken(anything())).thenReturn(TOKEN);
            when(mapper.mapToDissolutionDirectorPatchRequest(form)).thenReturn(body);
        });

        describe("for a dissolution without a transaction", () => {
            const req = { params: { companyNumber: COMPANY_NUMBER } } as any;

            it("should map the form data to a director patch request and send it to the API", async () => {
                await service.updateSignatory(req, dissolutionSession, form);

                verify(client.patchDissolutionDirector(TOKEN, COMPANY_NUMBER, SIGNATORY_ID, body)).once();
                verify(
                    client.updateSignatoryDetails(anything(), anything(), anything(), anything(), anything())
                ).never();
            });

            it("should propagate errors from the api client", async () => {
                when(client.patchDissolutionDirector(TOKEN, COMPANY_NUMBER, SIGNATORY_ID, body)).thenReject(
                    new Error("api failure")
                );

                try {
                    await service.updateSignatory(req, dissolutionSession, form);
                    assert.fail();
                } catch (e: any) {
                    assert.equal(e.message, "api failure");
                }
            });
        });

        describe("for a dissolution with a transaction", () => {
            const req = { params: { companyNumber: COMPANY_NUMBER, transactionId: TRANSACTION_ID } } as any;

            it("should map the form data and send the signatory details to the API for the transaction", async () => {
                await service.updateSignatory(req, dissolutionSession, form);

                const [token, companyNumber, transactionId, signatoryId, sentBody] = capture(
                    client.updateSignatoryDetails
                ).last();

                assert.equal(token, TOKEN);
                assert.equal(companyNumber, COMPANY_NUMBER);
                assert.equal(transactionId, TRANSACTION_ID);
                assert.equal(signatoryId, SIGNATORY_ID);
                assert.deepEqual(sentBody, body);
                verify(client.patchDissolutionDirector(anything(), anything(), anything(), anything())).never();
            });

            it("should propagate errors from the api client", async () => {
                when(
                    client.updateSignatoryDetails(TOKEN, COMPANY_NUMBER, TRANSACTION_ID, SIGNATORY_ID, body)
                ).thenReject(new Error("api failure"));

                try {
                    await service.updateSignatory(req, dissolutionSession, form);
                    assert.fail();
                } catch (e: any) {
                    assert.equal(e.message, "api failure");
                }
            });
        });
    });
});
