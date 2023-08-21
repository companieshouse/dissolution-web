import "reflect-metadata"

import { provide } from "inversify-binding-decorators"

import DissolutionDirectorPatchRequest from "app/models/dto/dissolutionDirectorPatchRequest"
import DissolutionGetDirector from "app/models/dto/dissolutionGetDirector"
import ChangeDetailsFormModel from "app/models/form/changeDetails.model"
import SignatorySigning from "app/models/form/signatorySigning.enum"

@provide(DissolutionDirectorMapper)
export default class DissolutionDirectorMapper {

    public mapToChangeDetailsForm (signatory: DissolutionGetDirector): ChangeDetailsFormModel {
        return this.isSigningOnBehalf(signatory)
            ? this.mapToOnBehalfForm(signatory) : this.mapToWillSignForm(signatory)
    }

    private isSigningOnBehalf (signatory: DissolutionGetDirector): boolean {
        return !!signatory.on_behalf_name
    }

    private mapToOnBehalfForm (signatory: DissolutionGetDirector): ChangeDetailsFormModel {
        return {
            isSigning: SignatorySigning.ON_BEHALF,
            onBehalfEmail: signatory.email,
            onBehalfName: signatory.on_behalf_name
        }
    }

    private mapToWillSignForm (signatory: DissolutionGetDirector): ChangeDetailsFormModel {
        return {
            isSigning: SignatorySigning.WILL_SIGN,
            directorEmail: signatory.email
        }
    }

    public mapToDissolutionDirectorPatchRequest (form: ChangeDetailsFormModel): DissolutionDirectorPatchRequest {
        const request: DissolutionDirectorPatchRequest = {
            email: form.isSigning === SignatorySigning.WILL_SIGN ? form.directorEmail! : form.onBehalfEmail!
        }

        if (form.isSigning === SignatorySigning.ON_BEHALF) {
            request.on_behalf_name = form.onBehalfName
        }

        return request
    }
}
