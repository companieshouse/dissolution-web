import 'reflect-metadata'

import { CompanyOfficer } from 'ch-sdk-node/dist/services/company-officers/types'
import { provide } from 'inversify-binding-decorators'

import DirectorDetails from 'app/models/view/directorDetails.model'

@provide(DirectorDetailsMapper)
export default class DirectorDetailsMapper {

  public mapToDirectorDetails(director: CompanyOfficer): DirectorDetails {
    return {
      id: this.extractDirectorId(director),
      name: director.name
    }
  }

  private extractDirectorId(director: CompanyOfficer): string {
    return director.links.officer.appointments.split('/')[2]
  }
}
