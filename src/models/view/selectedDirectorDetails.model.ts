import OfficerRole from "app/models/dto/officerRole.enum"

export default interface SelectedDirectorDetails {
    id: string
    name: string
    officerRole: OfficerRole
    onBehalfName?: string
}

