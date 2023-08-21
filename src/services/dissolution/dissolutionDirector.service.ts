import "reflect-metadata"

import { inject } from "inversify"
import { provide } from "inversify-binding-decorators"
import { DissolutionApiClient } from "../clients/dissolutionApi.client"
import DissolutionService from "./dissolution.service"

import DissolutionDirectorMapper from "app/mappers/dissolution/dissolutionDirector.mapper"
import DissolutionDirectorPatchRequest from "app/models/dto/dissolutionDirectorPatchRequest"
import DissolutionGetDirector from "app/models/dto/dissolutionGetDirector"
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse"
import ChangeDetailsFormModel from "app/models/form/changeDetails.model"
import Optional from "app/models/optional"
import DissolutionSession from "app/models/session/dissolutionSession.model"

@provide(DissolutionDirectorService)
export default class DissolutionDirectorService {

    public constructor (
    @inject(DissolutionService) private dissolutionService: DissolutionService,
    @inject(DissolutionDirectorMapper) private mapper: DissolutionDirectorMapper,
    @inject(DissolutionApiClient) private client: DissolutionApiClient
    ) {}

    public async getSignatoryToEdit (token: string, session: DissolutionSession): Promise<DissolutionGetDirector> {
        const dissolution: DissolutionGetResponse = (await this.dissolutionService.getDissolution(token, session))!

        const signatoryToEdit: Optional<DissolutionGetDirector> = this.getSignatoryById(dissolution, session)

        if (!signatoryToEdit) {
            return Promise.reject("Signatory in session not present on dissolution")
        }

        return signatoryToEdit
    }

    private getSignatoryById (dissolution: DissolutionGetResponse, session: DissolutionSession): Optional<DissolutionGetDirector> {
        return dissolution.directors.find(director => director.officer_id === session.signatoryIdToEdit)
    }

    public async updateSignatory (token: string, session: DissolutionSession, form: ChangeDetailsFormModel): Promise<void> {
        const request: DissolutionDirectorPatchRequest = this.mapper.mapToDissolutionDirectorPatchRequest(form)
        return this.client.patchDissolutionDirector(token, session.companyNumber!, session.signatoryIdToEdit!, request)
    }
}
