import OfficerRole from "app/models/dto/officerRole.enum"

export default interface DirectorDetails {
  id: string
  name: string
  officerRole: OfficerRole
}
