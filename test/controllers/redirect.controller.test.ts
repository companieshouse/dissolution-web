import 'reflect-metadata'

import { assert } from 'chai'
import { Application, Request } from 'express'
import { INTERNAL_SERVER_ERROR, MOVED_TEMPORARILY } from 'http-status-codes'
import request from 'supertest'
import { anything, capture, instance, mock, verify, when } from 'ts-mockito'
import { ArgCaptor2 } from 'ts-mockito/lib/capture/ArgCaptor'
import { createApp } from './helpers/application.factory'

import 'app/controllers/redirect.controller'
import DissolutionApprovalMapper from 'app/mappers/approval/dissolutionApproval.mapper'
import ApplicationStatus from 'app/models/dto/applicationStatus.enum'
import DissolutionGetDirector from 'app/models/dto/dissolutionGetDirector'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import PaymentStatus from 'app/models/dto/paymentStatus.enum'
import DissolutionApprovalModel from 'app/models/form/dissolutionApproval.model'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import {
  CERTIFICATE_SIGNED_URI, ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI,
  PAYMENT_CALLBACK_URI, PAYMENT_URI,
  REDIRECT_GATE_URI,
  SEARCH_COMPANY_URI,
  SELECT_DIRECTOR_URI,
  VIEW_FINAL_CONFIRMATION_URI,
  WAIT_FOR_OTHERS_TO_SIGN_URI,
  NOT_SELECTED_SIGNATORY
} from 'app/paths'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import SessionService from 'app/services/session/session.service'

import { generateApprovalModel, generateDissolutionGetResponse, generateGetDirector } from 'test/fixtures/dissolutionApi.fixtures'
import { generateDissolutionSession } from 'test/fixtures/session.fixtures'

describe('RedirectController', () => {

  let session: SessionService
  let service: DissolutionService
  let mapper: DissolutionApprovalMapper

  const USER_EMAIL = 'myemail@mail.com'
  const OTHER_USER_EMAIL = 'another@mail.com'
  const TOKEN = 'some-token'

  beforeEach(() => {
    session = mock(SessionService)
    service = mock(DissolutionService)
    mapper = mock(DissolutionApprovalMapper)

    when(session.getAccessToken(anything())).thenReturn(TOKEN)
  })

  function initApp(): Application {
    return createApp(container => {
      container.rebind(SessionService).toConstantValue(instance(session))
      container.rebind(DissolutionService).toConstantValue(instance(service))
      container.rebind(DissolutionApprovalMapper).toConstantValue(instance(mapper))
    })
  }

  describe('redirect GET request', () => {
    let dissolutionSession: DissolutionSession

    beforeEach(() => {
      dissolutionSession = generateDissolutionSession()

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
      when(session.getUserEmail(anything())).thenReturn(USER_EMAIL)
    })

    it('should update dissolution session with reference number', async () => {
      const referenceNumber = '123456'

      const dissolution: DissolutionGetResponse = generateDissolutionGetResponse()
      dissolution.application_reference = referenceNumber

      when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)

      await request(initApp())
        .get(REDIRECT_GATE_URI)

      verify(session.setDissolutionSession(anything(), anything())).once()

      const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
      const updatedSession: DissolutionSession = sessionCaptor.last()[1]

      assert.equal(updatedSession.applicationReferenceNumber, referenceNumber)
    })

    it('should redirect to select director page if dissolution has not yet been created', async () => {
      when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(null)

      await request(initApp())
        .get(REDIRECT_GATE_URI)
        .expect(MOVED_TEMPORARILY)
        .expect('Location', SELECT_DIRECTOR_URI)
    })

    describe('Pending Approval', () => {
      let dissolution: DissolutionGetResponse

      beforeEach(() => {
        dissolution = generateDissolutionGetResponse()
        dissolution.application_status = ApplicationStatus.PENDING_APPROVAL
      })

      it('should redirect to sign certificate page if the application if user is pending signatory', async () => {
        const signatory: DissolutionGetDirector = { ...generateGetDirector(), email: USER_EMAIL, approved_at: undefined }
        dissolution.directors = [signatory]

        const approval: DissolutionApprovalModel = generateApprovalModel()

        when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)
        when(mapper.mapToApprovalModel(dissolution, signatory)).thenReturn(approval)

        await request(initApp())
          .get(REDIRECT_GATE_URI)
          .expect(MOVED_TEMPORARILY)
          .expect('Location', ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)

        verify(mapper.mapToApprovalModel(dissolution, signatory)).once()
        verify(session.setDissolutionSession(anything(), anything())).once()

        const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
        const updatedSession: DissolutionSession = sessionCaptor.last()[1]

        assert.equal(updatedSession.approval, approval)
      })

      it('should redirect to wait for others to sign page if the user is the applicant and user is not pending signatory', async () => {
        dissolution.created_by = USER_EMAIL
        dissolution.directors = [
          { ...generateGetDirector(), email: USER_EMAIL, approved_at: '2020-07-01' }
        ]

        when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)

        await request(initApp())
          .get(REDIRECT_GATE_URI)
          .expect(MOVED_TEMPORARILY)
          .expect('Location', WAIT_FOR_OTHERS_TO_SIGN_URI)
      })

      it('should redirect to certificate signed page when the user is not the applicant but has already signed ', async () => {
        dissolution.created_by = OTHER_USER_EMAIL
        dissolution.directors = [
          { ...generateGetDirector(), email: USER_EMAIL, approved_at: '2020-07-01' }
        ]

        when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)

        await request(initApp())
          .get(REDIRECT_GATE_URI)
          .expect(MOVED_TEMPORARILY)
          .expect('Location', CERTIFICATE_SIGNED_URI)
      })
    })

    describe('Pending Payment', () => {
      let dissolution: DissolutionGetResponse

      beforeEach(() => {
        dissolution = generateDissolutionGetResponse()
        dissolution.application_status = ApplicationStatus.PENDING_PAYMENT
      })

      it('should redirect to payment when the user is the applicant', async () => {
        dissolution.created_by = USER_EMAIL

        when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)

        await request(initApp())
          .get(REDIRECT_GATE_URI)
          .expect(MOVED_TEMPORARILY)
          .expect('Location', PAYMENT_URI)
      })

      it('should redirect to certificate signed when the user is not the applicant', async () => {
        const signatory: DissolutionGetDirector = { ...generateGetDirector(), email: USER_EMAIL, approved_at: "true" }
        dissolution.directors = [signatory]
        dissolution.created_by = OTHER_USER_EMAIL

        when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)

        await request(initApp())
          .get(REDIRECT_GATE_URI)
          .expect(MOVED_TEMPORARILY)
          .expect('Location', CERTIFICATE_SIGNED_URI)
      })
    })

    describe('Paid', () => {
      let dissolution: DissolutionGetResponse

      beforeEach(() => {
        dissolution = generateDissolutionGetResponse()
        dissolution.application_status = ApplicationStatus.PAID
      })

      it('should redirect to confirmation page', async () => {
        when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)

        await request(initApp())
          .get(REDIRECT_GATE_URI)
          .expect(MOVED_TEMPORARILY)
          .expect('Location', VIEW_FINAL_CONFIRMATION_URI)
      })
    })
  })

  describe('payment callback GET request', () => {
    const STATE: string = 'ABC123'
    const REF: string = 'ABC123'

    let dissolutionSession: DissolutionSession = generateDissolutionSession()

    beforeEach(() => {
      dissolutionSession = generateDissolutionSession()
      dissolutionSession.paymentStateUUID = STATE

      when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
    })

    it('should throw an error if GovPay state is invalid', async () => {
      await request(initApp())
        .get(PAYMENT_CALLBACK_URI)
        .query({
          state: 'not-valid-state',
          status: PaymentStatus.PAID,
          ref: '123456'
        })
        .expect(INTERNAL_SERVER_ERROR)
    })

    it('should update dissolution session with reference number', async () => {
      await request(initApp())
        .get(PAYMENT_CALLBACK_URI)
        .query({
          state: STATE,
          status: PaymentStatus.PAID,
          ref: REF
        })
        .expect(MOVED_TEMPORARILY)
        .expect('Location', VIEW_FINAL_CONFIRMATION_URI)

      verify(session.setDissolutionSession(anything(), anything())).once()

      const sessionCaptor: ArgCaptor2<Request, DissolutionSession> = capture<Request, DissolutionSession>(session.setDissolutionSession)
      const updatedSession: DissolutionSession = sessionCaptor.last()[1]

      assert.equal(updatedSession.applicationReferenceNumber, REF)
    })

    it('should redirect to confirmation page if status is paid', async () => {
      await request(initApp())
        .get(PAYMENT_CALLBACK_URI)
        .query({
          state: STATE,
          status: PaymentStatus.PAID,
          ref: REF
        })
        .expect(MOVED_TEMPORARILY)
        .expect('Location', VIEW_FINAL_CONFIRMATION_URI)
    })

    it('should redirect to payment if status is failed', async () => {
      await request(initApp())
        .get(PAYMENT_CALLBACK_URI)
        .query({
          state: STATE,
          status: PaymentStatus.FAILED,
          ref: REF
        })
        .expect(MOVED_TEMPORARILY)
        .expect('Location', PAYMENT_URI)
    })

    it('should redirect to search company if status is cancelled', async () => {
      await request(initApp())
        .get(PAYMENT_CALLBACK_URI)
        .query({
          state: STATE,
          status: PaymentStatus.CANCELLED,
          ref: REF
        })
        .expect(MOVED_TEMPORARILY)
        .expect('Location', SEARCH_COMPANY_URI)
    })
  })

  describe('Unauthroised User', () => {
    let dissolution: DissolutionGetResponse
    const dissolutionSession: DissolutionSession = generateDissolutionSession()

    beforeEach(() => {
      dissolution = generateDissolutionGetResponse()
      dissolution.application_status = ApplicationStatus.PENDING_PAYMENT
    })

    it('should redirect to not authorised page if application is pending approval and email address is unauthorised', async () => {
      const signatory: DissolutionGetDirector = { ...generateGetDirector(), email: USER_EMAIL, approved_at: "true" }
      dissolution.directors = [signatory]
      dissolution.created_by = OTHER_USER_EMAIL

      when(service.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)

      await request(initApp())
        .get(REDIRECT_GATE_URI)
        .expect(MOVED_TEMPORARILY)
        .expect('Location', NOT_SELECTED_SIGNATORY)
    })
  })
})
