import DissolutionSession from "app/models/session/dissolutionSession.model"
import { DirectorToSign } from "app/models/session/directorToSign.model"
import { DirectorToSignBuilder } from "./directorToSign.builder"
import OfficerType from "app/models/dto/officerType.enum"
import { DefineSignatoryInfoFormModel } from "app/models/form/defineSignatoryInfo.model"
import DissolutionGetDirector from "app/models/dto/dissolutionGetDirector"

export class DissolutionSessionBuilder {
    officerType?: OfficerType
    directorsToSign: DirectorToSign[] = []
    defineSignatoryInfoForm?: DefineSignatoryInfoFormModel
    private _isMultiDirector?: boolean
    signatoryIdToEdit?: string
    signatoryToEdit?: DissolutionGetDirector

    withDirectorsToSign (directors: DirectorToSign[]): DissolutionSessionBuilder {
        this.directorsToSign = directors
        return this
    }

    withDirectorToSign (directorBuilder: DirectorToSignBuilder): DissolutionSessionBuilder {
        this.directorsToSign.push(directorBuilder.build())
        return this
    }

    withOfficerType (officerType: OfficerType) {
        this.officerType = officerType
        return this
    }

    withDefineSignatoryInfoForm (defineSignatoryInfoForm: DefineSignatoryInfoFormModel) {
        this.defineSignatoryInfoForm = defineSignatoryInfoForm
        return this
    }

    public withIsMultiDirector (isMultiDirector: boolean): this {
        this._isMultiDirector = isMultiDirector
        return this
    }

    public withSignatoryIdToEdit (signatoryId?: string): this {
        this.signatoryIdToEdit = signatoryId
        return this
    }

    public withSignatoryToEdit (signatoryBuilder: DissolutionGetDirector): this {
        this.signatoryToEdit = signatoryBuilder
        return this
    }

    public build (): DissolutionSession {
        return {
            officerType: this.officerType,
            directorsToSign: this.directorsToSign,
            defineSignatoryInfoForm: this.defineSignatoryInfoForm,
            isMultiDirector: this._isMultiDirector,
            signatoryIdToEdit: this.signatoryIdToEdit,
            signatoryToEdit: this.signatoryToEdit
        } as DissolutionSession
    }
}

export function aDissolutionSession (): DissolutionSessionBuilder {
    return new DissolutionSessionBuilder()
}
