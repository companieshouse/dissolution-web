import "reflect-metadata"

import {provide} from "inversify-binding-decorators"

import {DirectorToSign} from "app/models/session/directorToSign.model"
import DirectorDetails from "app/models/view/directorDetails.model"
import SelectedDirectorDetails from "app/models/view/selectedDirectorDetails.model"

@provide(DirectorToSignMapper)
export default class DirectorToSignMapper {

    public mapAsApplicant(selectedDirector: SelectedDirectorDetails, email: string): DirectorToSign {
        return {
            id: selectedDirector.id,
            name: selectedDirector.name,
            officerRole: selectedDirector.officerRole,
            email,
            isApplicant: true,
            ...(selectedDirector.onBehalfName !== undefined && { onBehalfName: selectedDirector.onBehalfName })
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
