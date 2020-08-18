import DissolutionLinks from 'app/models/dto/dissolutionLinks'

export default interface DissolutionCreateResponse {
  application_reference_number: string,
  links: DissolutionLinks
}
