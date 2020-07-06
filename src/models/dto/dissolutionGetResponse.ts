import { ApplicationStatusEnum } from 'app/models/dto/applicationStatus.enum'
import { ApplicationTypeEnum } from 'app/models/dto/applicationType.enum'
import { DissolutionGetDirector } from 'app/models/dto/dissolutionGetDirector'
import { DissolutionLinks } from 'app/models/dto/dissolutionLinks'

export interface DissolutionGetResponse {
  ETag: string,
  kind: string,
  links: DissolutionLinks,
  application_status: ApplicationStatusEnum,
  application_reference: string,
  application_type: ApplicationTypeEnum,
  company_name: string,
  company_number: string,
  created_at: string,
  created_by: string,
  directors: DissolutionGetDirector[]
}