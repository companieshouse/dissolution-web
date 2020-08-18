import ApplicationStatus from 'app/models/dto/applicationStatus.enum'
import ApplicationType from 'app/models/dto/applicationType.enum'
import DissolutionGetDirector from 'app/models/dto/dissolutionGetDirector'
import DissolutionLinks from 'app/models/dto/dissolutionLinks'

export default interface DissolutionGetResponse {
  ETag: string
  kind: string
  links: DissolutionLinks
  application_status: ApplicationStatus
  application_reference: string
  application_type: ApplicationType
  company_name: string
  company_number: string
  created_at: string
  created_by: string
  directors: DissolutionGetDirector[]
  certificate_bucket: string
  certificate_key: string
}
