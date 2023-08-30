import "reflect-metadata"

import { provide } from "inversify-binding-decorators"

import { DirectorToSign } from "app/models/session/directorToSign.model"
import DirectorDetails from "app/models/view/directorDetails.model"

@provide(DirectorToSignMapper)
export default class DirectorToSignMapper {

    public mapAsApplicant (selectedDirector: DirectorDetails, email: string): DirectorToSign {
        return {
            id: selectedDirector.id,
            name: selectedDirector.name,
            email,
            isApplicant: true
        }
    }

    public mapAsSignatory (director: DirectorDetails): DirectorToSign {
        return {
            id: director.id,
            name: director.name,
            isApplicant: false
        }
    }
}
