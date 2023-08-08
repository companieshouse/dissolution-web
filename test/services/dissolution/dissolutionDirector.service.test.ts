import { assert } from "chai";
import { instance, mock, verify, when } from "ts-mockito";
import { generateWillSignChangeDetailsFormModel } from "../../fixtures/companyOfficers.fixtures";
import { TOKEN } from "../../fixtures/session.fixtures";

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
    generateDissolutionDirectorPatchRequest, generateDissolutionGetResponse, generateGetDirector
} from "test/fixtures/dissolutionApi.fixtures";
import { generateDissolutionSession } from "test/fixtures/session.fixtures";

describe("DissolutionDirectorService", () => {
    let service: DissolutionDirectorService;

    let dissolutionService: DissolutionService;
    let mapper: DissolutionDirectorMapper;
    let client: DissolutionApiClient;

    beforeEach(() => {
        dissolutionService = mock(DissolutionService);
        mapper = mock(DissolutionDirectorMapper);
        client = mock(DissolutionApiClient);

        service = new DissolutionDirectorService(
            instance(dissolutionService),
            instance(mapper),
            instance(client)
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
            dissolution.directors = [
                { ...generateGetDirector(), officer_id: SIGNATORY_1_ID }
            ];
            dissolutionSession.signatoryIdToEdit = SIGNATORY_2_ID;

            when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution);

            try {
                await service.getSignatoryToEdit(TOKEN, dissolutionSession);
                assert.fail();
            } catch (err) {
                assert.equal(err, "Signatory in session not present on dissolution");
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
        const SIGNATORY_ID = "abc123";

        let dissolutionSession: DissolutionSession;

        beforeEach(() => {
            dissolutionSession = generateDissolutionSession();
            dissolutionSession.companyNumber = COMPANY_NUMBER;
            dissolutionSession.signatoryIdToEdit = SIGNATORY_ID;
        });

        it("should map the form data to a director patch request and send it to the API", async () => {
            const form: ChangeDetailsFormModel = generateWillSignChangeDetailsFormModel();
            const request: DissolutionDirectorPatchRequest = generateDissolutionDirectorPatchRequest();

            when(mapper.mapToDissolutionDirectorPatchRequest(form)).thenReturn(request);

            await service.updateSignatory(TOKEN, dissolutionSession, form);

            verify(client.patchDissolutionDirector(TOKEN, COMPANY_NUMBER, SIGNATORY_ID, request)).once();
        });
    });
});
