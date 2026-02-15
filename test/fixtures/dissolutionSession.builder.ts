import DissolutionSession from "app/models/session/dissolutionSession.model"
import { DirectorToSign } from "app/models/session/directorToSign.model"
import { DirectorToSignBuilder, aDirectorToSign } from "./directorToSign.builder"
import OfficerType from "app/models/dto/officerType.enum"
import { DefineSignatoryInfoFormModel } from "app/models/form/defineSignatoryInfo.model"

export class DissolutionSessionBuilder {
    officerType?: OfficerType
    directorsToSign: DirectorToSign[] = []
    defineSignatoryInfoForm?: DefineSignatoryInfoFormModel
    // Add other fields as needed, e.g. applicant, companyNumber, etc.

    withDirectorsToSign (directors: DirectorToSign[]): DissolutionSessionBuilder {
        this.directorsToSign = directors
        return this
    }

    withDirectorToSign (directorBuilder: DirectorToSignBuilder): DissolutionSessionBuilder {
        this.directorsToSign.push(directorBuilder.build())
        return this
    }

    // Add more fluent setters for other fields as needed

    build (): DissolutionSession {
        return {
            officerType: this.officerType,
            directorsToSign: this.directorsToSign,
            defineSignatoryInfoForm: this.defineSignatoryInfoForm
        } as DissolutionSession
    }

    withOfficerType (officerType: OfficerType) {
        this.officerType = officerType
        return this
    }

    withDefineSignatoryInfoForm (defineSignatoryInfoForm: DefineSignatoryInfoFormModel) {
        this.defineSignatoryInfoForm = defineSignatoryInfoForm
        return this
    }
}

// Factory helper functions (Nat Pryce-style fluent factories) to make test setup concise
export function aDissolutionSession (): DissolutionSessionBuilder {
    return new DissolutionSessionBuilder()
}
