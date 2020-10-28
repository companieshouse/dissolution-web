import ApplicationStatus from 'app/models/dto/applicationStatus.enum'
import ApplicationType from 'app/models/dto/applicationType.enum'
import { DirectorRequest, DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import DissolutionCreateResponse from 'app/models/dto/dissolutionCreateResponse'
import DissolutionGetDirector from 'app/models/dto/dissolutionGetDirector'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import DissolutionLinks from 'app/models/dto/dissolutionLinks'
import DissolutionPatchRequest from 'app/models/dto/dissolutionPatchRequest'
import DissolutionPatchResponse from 'app/models/dto/dissolutionPatchResponse'
import OfficerType from 'app/models/dto/officerType.enum'
import DissolutionApprovalModel from 'app/models/form/dissolutionApproval.model'

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
    links: generateLinks()
  }
}

export function generateDissolutionGetResponse(): DissolutionGetResponse {
  return {
    ETag: 'ETag',
    kind: 'kind',
    links: generateLinks(),
    application_status: ApplicationStatus.PENDING_APPROVAL,
    application_reference: 'asd',
    application_type: ApplicationType.DS01,
    company_number: '12345678',
    company_name: 'example name',
    created_at: new Date().toDateString(),
    created_by: 'some name',
    directors: [
      generateGetDirector('Prime Tyrannosaurus'),
      generateGetDirector('Rising Whale')
    ],
    certificate_key: 'some-key',
    certificate_bucket: 'some-bucket'
  }
}

export function generateDirectorRequest(name: string): DirectorRequest {
  return {
    officer_id: 'abc123',
    email: generateEmail(name)
  }
}

export function generateLinks(): DissolutionLinks {
  return {
    self: 'self',
    payment: 'payment'
  }
}

export function generateGetDirector(name: string = 'Jane Smith'): DissolutionGetDirector {
  return {
    officer_id: 'abc123',
    name,
    email: generateEmail(name),
  }
}

export function generateApprovalModel(): DissolutionApprovalModel {
  return {
    officerId: 'abc123',
    companyName: 'Example Company',
    companyNumber: '12345678',
    applicant: 'John Doe',
    date: new Date().toDateString(),
    officerType: OfficerType.DIRECTOR
  }
}

export function generateDissolutionPatchRequest(): DissolutionPatchRequest {
  return {
    officer_id: 'abc123',
    has_approved: true,
    ip_address: '127.0.0.1'
  }
}

export function generateDissolutionPatchResponse(): DissolutionPatchResponse {
  return {
    links: generateLinks()
  }
}
