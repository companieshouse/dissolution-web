import "reflect-metadata"

import { provide } from "inversify-binding-decorators"

import { DirectorToSign } from "app/models/session/directorToSign.model"
import DirectorDetails from "app/models/view/directorDetails.model"
import OfficerRole from "app/models/dto/officerRole.enum"

@provide(DirectorToSignMapper)
export default class DirectorToSignMapper {

    public mapAsApplicant (selectedDirector: DirectorDetails, email: string): DirectorToSign {
        return {
            id: selectedDirector.id,
            name: selectedDirector.name,
            officerRole: selectedDirector.officerRole,
            email,
            isApplicant: true
        }
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
