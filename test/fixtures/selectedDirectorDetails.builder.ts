import SelectedDirectorDetails from "app/models/view/selectedDirectorDetails.model"
import OfficerRole from "app/models/dto/officerRole.enum"

export class SelectedDirectorDetailsBuilder {
    private _id: string = "default-id"
    private _name: string = "default-name"
    private _officerRole: string = OfficerRole.DIRECTOR
    private _onBehalfName?: string

    withId(id: string): this {
        this._id = id
        return this
    }

    withName(name: string): this {
        this._name = name
        return this
    }

    withOfficerRole(officerRole: string): this {
        this._officerRole = officerRole
        return this
    }

    withOnBehalfName(onBehalfName: string): this {
        this._onBehalfName = onBehalfName
        return this
    }

    build(): SelectedDirectorDetails {
        return {
            id: this._id,
            name: this._name,
            officerRole: this._officerRole,
            onBehalfName: this._onBehalfName
        }
    }
}

export function aSelectedDirectorDetails(): SelectedDirectorDetailsBuilder {
    return new SelectedDirectorDetailsBuilder()
}

