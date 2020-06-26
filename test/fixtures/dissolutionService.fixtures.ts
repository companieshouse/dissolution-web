import { DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'

export function generateDissolutionCreateRequest(): DissolutionCreateRequest {
  return {
    directors: [
      {name: 'Ashamed Alligator', email: 'ashameda@company.com'},
      {name: 'Sympathetic Hippopotamus', email: 'sympathetich@company.com'},
      {name: 'Radical Wombat', email: 'radicalw@company.com', onBehalfName: 'Mysterious Boar'}
    ]
  }
}