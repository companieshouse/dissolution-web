import "reflect-metadata"

import { provide } from "inversify-binding-decorators"

import DissolutionDirectorPatchRequest from "app/models/dto/dissolutionDirectorPatchRequest"
import DissolutionGetDirector, { isCorporateOfficer } from "app/models/dto/dissolutionGetDirector"
import ChangeDetailsFormModel from "app/models/form/changeDetails.model"

@provide(DissolutionDirectorMapper)
export default class DissolutionDirectorMapper {

    public mapToChangeDetailsForm (signatory: DissolutionGetDirector): ChangeDetailsFormModel {
        return isCorporateOfficer(signatory)
            ? this.mapToCorporateOfficerForm(signatory)
            : this.mapToStandardOfficerForm(signatory)
    }

    private mapToCorporateOfficerForm (signatory: DissolutionGetDirector): ChangeDetailsFormModel {
        return {
            onBehalfEmail: signatory.email,
            onBehalfName: signatory.on_behalf_name
        }
    }

    private mapToStandardOfficerForm (signatory: DissolutionGetDirector): ChangeDetailsFormModel {
        return {
            directorEmail: signatory.email
        }
    }

    public mapToDissolutionDirectorPatchRequest (form: ChangeDetailsFormModel): DissolutionDirectorPatchRequest {
        if (form.onBehalfName) {
            return {
                email: form.onBehalfEmail || "",
                on_behalf_name: form.onBehalfName
            }
        }

        return {
            email: form.directorEmail || ""
        }
    }
}
