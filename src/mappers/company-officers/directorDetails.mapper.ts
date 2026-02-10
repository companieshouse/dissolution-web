import "reflect-metadata"

import { CompanyOfficer } from "@companieshouse/api-sdk-node/dist/services/company-officers/types"
import { provide } from "inversify-binding-decorators"

import DirectorDetails from "app/models/view/directorDetails.model"
import OfficerRole from "app/models/dto/officerRole.enum"

@provide(DirectorDetailsMapper)
export default class DirectorDetailsMapper {

    public mapToDirectorDetails (director: CompanyOfficer): DirectorDetails {
        return {
            id: this.extractDirectorId(director),
            name: director.name,
            officerRole: director.officerRole as OfficerRole
        }
    }

    private extractDirectorId (director: CompanyOfficer): string {
        return director.links.officer.appointments.split("/")[2]
    }
}
