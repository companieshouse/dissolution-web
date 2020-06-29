import { DirectorRequest, DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import { DissolutionCreateResponse } from 'app/models/dto/dissolutionCreateResponse'

import { generateEmail } from 'test/fixtures/util.fixtures'

export function generateDissolutionCreateRequest(): DissolutionCreateRequest {
  return {
    directors: [
      generateDirectorRequest('Ashamed Alligator'),
      generateDirectorRequest('Sympathetic Hippopotamus'),
      generateDirectorRequest('Radical Wombat')
    ]
  }
}

export function generateDissolutionCreateResponse(referenceNumber: string = '123ABC'): DissolutionCreateResponse {
  return {
    application_reference_number: referenceNumber,
    links: {
      self: 'self',
      payment: 'payment'
    }
  }
}

export function generateDirectorRequest(name: string): DirectorRequest {
  return {
    name,
    email: generateEmail(name)
  }
}