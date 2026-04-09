import "reflect-metadata"

import { provide } from "inversify-binding-decorators"

import { DirectorToSign } from "app/models/session/directorToSign.model"
import DirectorDetails from "app/models/view/directorDetails.model"
import SelectedDirectorDetails from "app/models/view/selectedDirectorDetails.model"
import OfficerRole from "app/models/dto/officerRole.enum";

@provide(DirectorToSignMapper)
export default class DirectorToSignMapper {

    public mapAsApplicant (selectedDirector: SelectedDirectorDetails, email: string): DirectorToSign {
        const result: any = {
            id: selectedDirector.id,
            name: selectedDirector.name,
            officerRole: selectedDirector.officerRole as OfficerRole,
            email,
            isApplicant: true
        }

        if (selectedDirector.onBehalfName !== undefined) {
            result.onBehalfName = selectedDirector.onBehalfName
        }

        return result
    }

    public mapAsSignatory (director: DirectorDetails): DirectorToSign {
        return {
            id: director.id,
            name: director.name,
            officerRole: director.officerRole,
            isApplicant: false
        }
    }
}
