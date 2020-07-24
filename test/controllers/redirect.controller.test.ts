import 'reflect-metadata'

import { assert } from 'chai'
import { Request } from 'express'
import { MOVED_TEMPORARILY } from 'http-status-codes'
import request from 'supertest'
import { anything, capture, instance, mock, verify, when } from 'ts-mockito'
import { ArgCaptor2 } from 'ts-mockito/lib/capture/ArgCaptor'
import { createApp } from './helpers/application.factory'

import 'app/controllers/redirect.controller'
import ApplicationStatus from 'app/models/dto/applicationStatus.enum'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import PaymentStatus from 'app/models/dto/paymentStatus.enum'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import {
  CERTIFICATE_SIGNED_URI, ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI,
  ERROR_URI, PAYMENT_CALLBACK_URI, PAYMENT_URI,
  REDIRECT_GATE_URI,
  SELECT_DIRECTOR_URI,
  VIEW_FINAL_CONFIRMATION_URI,
  WAIT_FOR_OTHERS_TO_SIGN_URI
} from 'app/paths'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import SessionService from 'app/services/session/session.service'

import { generateDissolutionGetResponse } from 'test/fixtures/dissolutionApi.fixtures'
import { generateDissolutionSession } from 'test/fixtures/session.fixtures'

describe('RedirectController', () => {

  let session: SessionService
  let service: DissolutionService

  const USER_EMAIL = 'myemail@mail.com'
  const TOKEN = 'some-token'

  beforeEach(() => {
    session = mock(SessionService)
    service = mock(DissolutionService)

    when(session.getAccessToken(anything())).thenReturn(TOKEN)
  })

  describe('redirect GET request', () => {
    it('should update dissolution session with reference number', async () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()
      const dissolution: DissolutionGetResponse = generateDissolutionGetResponse()
      const referenceNumber = '123456'
      dissolution.application_reference = referenceNumber

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(DissolutionService).toConstantValue(instance(service))
      })

      await request(app)
        .get(REDIRECT_GATE_URI)

      verify(session.setDissolutionSession(anything(), anything())).once()

      const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
      const updatedSession: DissolutionSession = sessionCaptor.last()[1]

      assert.equal(updatedSession.applicationReferenceNumber, referenceNumber)
    })

    it('should redirect to select director page if dissolution has not yet been created', async () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(null)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(DissolutionService).toConstantValue(instance(service))
      })

      await request(app)
        .get(REDIRECT_GATE_URI)
        .expect(MOVED_TEMPORARILY)
        .expect('Location', SELECT_DIRECTOR_URI)
    })

    it('should redirect to sign certificate page if the application is pending approval and user is pending signatory', async () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()
      const dissolution: DissolutionGetResponse = generateDissolutionGetResponse()

      dissolution.directors[0].email = USER_EMAIL
      dissolution.application_status = ApplicationStatus.PENDING_APPROVAL

      when(session.getUserEmail(anything())).thenReturn(USER_EMAIL)
      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(DissolutionService).toConstantValue(instance(service))
      })

      await request(app)
        .get(REDIRECT_GATE_URI)
        .expect(MOVED_TEMPORARILY)
        .expect('Location', ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)

      verify(session.setDissolutionSession(anything(), anything())).twice()

      const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
      const updatedSession: DissolutionSession = sessionCaptor.last()[1]

      assert.equal(dissolution.company_number, updatedSession.approval!.companyNumber)
      assert.equal(dissolution.company_name, updatedSession.approval!.companyName)
      assert.equal(dissolution.directors[0].name, updatedSession.approval!.applicant)
      assert.isNotNull(updatedSession.approval!.date)
    })

    it('should redirect to wait for others to sign page if the user is the applicant and application is pending approval ' +
      'and user is not pending signatory', async () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()
      const dissolution: DissolutionGetResponse = generateDissolutionGetResponse()

      dissolution.created_by = USER_EMAIL
      dissolution.directors[0].email = USER_EMAIL
      dissolution.directors[0].approved_at = '2020-07-01'
      dissolution.application_status = ApplicationStatus.PENDING_APPROVAL

      when(session.getUserEmail(anything())).thenReturn(USER_EMAIL)
      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(DissolutionService).toConstantValue(instance(service))
      })

      await request(app)
        .get(REDIRECT_GATE_URI)
        .expect(MOVED_TEMPORARILY)
        .expect('Location', WAIT_FOR_OTHERS_TO_SIGN_URI)
    })

    it('should redirect to certificate signed page when the user is not the applicant but has already signed ', async () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()
      const dissolution: DissolutionGetResponse = generateDissolutionGetResponse()

      dissolution.directors[0].email = USER_EMAIL
      dissolution.directors[0].approved_at = '2020-07-01'
      dissolution.application_status = ApplicationStatus.PENDING_APPROVAL

      when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)
      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(DissolutionService).toConstantValue(instance(service))
      })

      await request(app)
        .get(REDIRECT_GATE_URI)
        .expect(MOVED_TEMPORARILY)
        .expect('Location', CERTIFICATE_SIGNED_URI)
    })

    it('should redirect to payment when the user is the applicant and application is pending payment', async () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()
      const dissolution: DissolutionGetResponse = generateDissolutionGetResponse()

      dissolution.created_by = USER_EMAIL
      dissolution.directors[0].email = USER_EMAIL
      dissolution.application_status = ApplicationStatus.PENDING_PAYMENT

      when(session.getUserEmail(anything())).thenReturn(USER_EMAIL)
      when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)
      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(DissolutionService).toConstantValue(instance(service))
      })

      await request(app)
        .get(REDIRECT_GATE_URI)
        .expect(MOVED_TEMPORARILY)
        .expect('Location', PAYMENT_URI)
    })

    it('should redirect to certificate signed when the user is not the applicant and application is pending payment', async () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()
      const dissolution: DissolutionGetResponse = generateDissolutionGetResponse()

      dissolution.application_status = ApplicationStatus.PENDING_PAYMENT

      when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)
      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(DissolutionService).toConstantValue(instance(service))
      })

      await request(app)
        .get(REDIRECT_GATE_URI)
        .expect(MOVED_TEMPORARILY)
        .expect('Location', CERTIFICATE_SIGNED_URI)
    })

    it('should redirect to confirmation page if application status is paid', async () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()
      const dissolution: DissolutionGetResponse = generateDissolutionGetResponse()

      dissolution.application_status = ApplicationStatus.PAID

      when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)
      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(DissolutionService).toConstantValue(instance(service))
      })

      await request(app)
        .get(REDIRECT_GATE_URI)
        .expect(MOVED_TEMPORARILY)
        .expect('Location', VIEW_FINAL_CONFIRMATION_URI)
    })
  })

  describe('payment callback GET request', () => {
    it('should update dissolution session with reference number', async () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()
      const referenceNumber: string = '123456'

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(DissolutionService).toConstantValue(instance(service))
      })

      dissolutionSession.paymentStateUUID = 'ABC123'

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

      await request(app)
        .get(PAYMENT_CALLBACK_URI)
        .query({
          state: 'ABC123',
          status: PaymentStatus.PAID,
          ref: referenceNumber
        })
        .expect(MOVED_TEMPORARILY)
        .expect('Location', VIEW_FINAL_CONFIRMATION_URI)

      verify(session.setDissolutionSession(anything(), anything())).once()

      const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
      const updatedSession: DissolutionSession = sessionCaptor.last()[1]

      assert.equal(updatedSession.applicationReferenceNumber, referenceNumber)
    })

    it('should redirect to confirmation page if GovPay state is valid and status is paid', async () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(DissolutionService).toConstantValue(instance(service))
      })

      dissolutionSession.paymentStateUUID = 'ABC123'

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

      await request(app)
        .get(PAYMENT_CALLBACK_URI)
        .query({
          state: 'ABC123',
          status: PaymentStatus.PAID,
          ref: '123456'
        })
        .expect(MOVED_TEMPORARILY)
        .expect('Location', VIEW_FINAL_CONFIRMATION_URI)
    })

    it('should redirect to not found if GovPay state is invalid and status is paid', async () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(DissolutionService).toConstantValue(instance(service))
      })

      dissolutionSession.paymentStateUUID = 'ABC321'

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

      await request(app)
        .get(PAYMENT_CALLBACK_URI)
        .query({
          state: 'ABC123',
          status: PaymentStatus.PAID,
          ref: '123456'
        })
        .expect(MOVED_TEMPORARILY)
        .expect('Location', ERROR_URI)
    })

    it('should redirect to not found if GovPay state is valid and status is not paid', async () => {
      const dissolutionSession: DissolutionSession = generateDissolutionSession()

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(DissolutionService).toConstantValue(instance(service))
      })

      dissolutionSession.paymentStateUUID = 'ABC123'

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)

      await request(app)
        .get(PAYMENT_CALLBACK_URI)
        .query({
          state: 'ABC123',
          status: PaymentStatus.CANCELLED,
          ref: '123456'
        })
        .expect(MOVED_TEMPORARILY)
        .expect('Location', ERROR_URI)
    })
  })
})
