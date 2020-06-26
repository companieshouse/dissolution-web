import { DissolutionCreateLinks } from 'app/models/dto/dissolutionCreateLinks'

export interface DissolutionCreateResponse {
  application_reference_number: string,
  links: DissolutionCreateLinks
}