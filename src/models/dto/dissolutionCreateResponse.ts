import { DissolutionLinks } from 'app/models/dto/dissolutionLinks'

export interface DissolutionCreateResponse {
  application_reference_number: string,
  links: DissolutionLinks
}