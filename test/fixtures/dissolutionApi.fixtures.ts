import { DirectorRequest, DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'

export function generateDissolutionCreateRequest(): DissolutionCreateRequest {
  return {
    directors: [
      generateDirectorRequest('Ashamed Alligator'),
      generateDirectorRequest('Sympathetic Hippopotamus'),
      generateDirectorRequest('Radical Wombat')
    ]
  }
}

export function generateDirectorRequest(name: string): DirectorRequest {
  return {
    name,
    email: generateEmail(name)
  }
}

function generateEmail(name: string): string {
  const prefix: string[] = name.split(' ', 2)
  return `${prefix[0].toLowerCase()}${prefix[1].toLowerCase()[0]}@company.com`
}