import { CompanyOfficer } from 'ch-sdk-node/dist/services/company-officers/types'
import { assert } from 'chai'

import DirectorDetailsMapper from 'app/mappers/company-officers/directorDetails.mapper'
import DirectorDetails from 'app/models/view/directorDetails.model'

import { generateCompanyOfficer } from 'test/fixtures/companyOfficers.fixtures'

describe('DirectorDetailsMapper', () => {

  const mapper: DirectorDetailsMapper = new DirectorDetailsMapper()

  describe('mapToDirectorDetails', () => {
    it('should extract the officer ID from the appointments link', () => {
      const director: CompanyOfficer = generateCompanyOfficer()
      director.links.officer.appointments = '/officers/J18mXSM4WHz7Ms7st0guroWwJRM/appointments'

      const result: DirectorDetails = mapper.mapToDirectorDetails(director)

      assert.equal(result.id, 'J18mXSM4WHz7Ms7st0guroWwJRM')
    })

    it('should map the name of the director to the director details', () => {
      const director: CompanyOfficer = generateCompanyOfficer()
      director.name = 'Some director name'

      const result: DirectorDetails = mapper.mapToDirectorDetails(director)

      assert.equal(result.name, 'Some director name')
    })
  })
})
