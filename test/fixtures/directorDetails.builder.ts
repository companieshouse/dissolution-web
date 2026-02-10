import DirectorDetails from "app/models/view/directorDetails.model"
import OfficerRole from "app/models/dto/officerRole.enum"

export class DirectorDetailsBuilder {
    private _id: string = "default-id"
    private _name: string = "default-name"
    private _officerRole?: OfficerRole = OfficerRole.DIRECTOR

    withId (id: string): this {
        this._id = id
        return this
    }

    withName (name: string): this {
        this._name = name
        return this
    }

    withOfficerRole (officerRole: OfficerRole): this {
        this._officerRole = officerRole
        return this
    }

    build (): DirectorDetails {
        return {
            ...({} as DirectorDetails),
            id: this._id,
            name: this._name,
            officerRole: this._officerRole as OfficerRole
        }
    }
}

export function aDirectorDetails (): DirectorDetailsBuilder {
    return new DirectorDetailsBuilder()
}
