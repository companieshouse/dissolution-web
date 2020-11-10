import ApplicationStatus from 'app/models/dto/applicationStatus.enum'
import ApplicationType from 'app/models/dto/applicationType.enum'
import { DirectorRequest, DissolutionCreateRequest } from 'app/models/dto/dissolutionCreateRequest'
import DissolutionCreateResponse from 'app/models/dto/dissolutionCreateResponse'
import DissolutionGetDirector from 'app/models/dto/dissolutionGetDirector'
import DissolutionGetPaymentUIData from 'app/models/dto/dissolutionGetPaymentUIData'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import DissolutionLinks from 'app/models/dto/dissolutionLinks'
import DissolutionPatchRequest from 'app/models/dto/dissolutionPatchRequest'
import DissolutionPatchResponse from 'app/models/dto/dissolutionPatchResponse'
import OfficerType from 'app/models/dto/officerType.enum'
import PaymentItem from 'app/models/dto/paymentItem'
import PaymentLinks from 'app/models/dto/paymentLinks'
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
    links: generateDissolutionLinks()
  }
}

export function generateDissolutionGetResponse(): DissolutionGetResponse {
  return {
    ETag: 'ETag',
    kind: 'kind',
    links: generateDissolutionLinks(),
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

export function generateDissolutionLinks(): DissolutionLinks {
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
    links: generateDissolutionLinks()
  }
}

export function generateDissolutionGetPaymentUIData(): DissolutionGetPaymentUIData {
  return {
    ETag: 'ETag',
    kind: 'kind',
    links: generatePaymentLinks(),
    company_number: '12345678',
    items: [ generatePaymentItem(), generatePaymentItem() ]
  }
}

function generatePaymentLinks(): PaymentLinks {
  return {
    self: 'self',
    dissolution_request: 'dissolution_request'
  }
}

function generatePaymentItem(): PaymentItem {
  return {
    description: 'Some payment description',
    description_identifier: 'Some payment description identifier',
    description_values: {},
    product_type: ApplicationType.DS01,
    amount: '8',
    available_payment_methods: ['credit-card'],
    class_of_payment: ['data-maintenance'],
    kind: 'dissolution-request#payment-details',
    resource_kind: 'dissolution-request#dissolution-request'
  }
}
