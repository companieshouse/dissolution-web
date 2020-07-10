import 'reflect-metadata'

import { assert } from 'chai'
import { BAD_REQUEST, OK, MOVED_TEMPORARILY } from 'http-status-codes'
import request from 'supertest'
import { anything, deepEqual, instance, mock, when } from 'ts-mockito'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/endorseCompanyClosureCertificate.controller'
import EndorseCertificateFormModel from 'app/models/form/endorseCertificateFormModel'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import ValidationErrors from 'app/models/view/validationErrors.model'
import { ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI, REDIRECT_GATE_URI } from 'app/paths'
import formSchema from 'app/schemas/endorseCertificate.schema'
import SessionService from 'app/services/session/session.service'
import FormValidator from 'app/utils/formValidator.util'

import { generateApprovalData } from 'test/fixtures/dissolutionApi.fixtures'
import { generateDissolutionSession } from 'test/fixtures/session.fixtures'
import DissolutionService from 'app/services/dissolution/dissolution.service'

describe('EndorseCompanyClosureCertificateController', () => {

  let session: SessionService

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '01777777'

  let dissolutionSession: DissolutionSession

  beforeEach(() => {
    session = mock(SessionService)

    dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
    dissolutionSession.approval = generateApprovalData()
    dissolutionSession.approval.companyName = 'Company 1'
    dissolutionSession.approval.companyNumber = '123456789'
    dissolutionSession.approval.applicant = 'John Smith'

    when(session.getAccessToken(anything())).thenReturn(TOKEN)
    when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
  })

  describe('GET request', () => {
    it('should render endorse certificate page', async () => {

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
      })

      const res = await request(app)
        .get(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'Sign the application'))
      assert.isTrue(htmlAssertHelper.hasText('div#companyName', 'Company name: Company 1'))
      assert.isTrue(htmlAssertHelper.hasText('div#companyNumber', 'Company number: 123456789'))
      assert.isTrue(htmlAssertHelper.hasText('span#applicantName', 'John Smith'))
    })
  })

describe('POST - ensure form submission is handled correctly', () => {
  it('should redirect successfully if validator returns no errors', async () => {
    const testObject: EndorseCertificateFormModel = { confirmation: 'understood' }

    const mockedFormValidator = mock(FormValidator)
    when(mockedFormValidator.validate(deepEqual(testObject), formSchema)).thenReturn(null)

    const app = createApp(container => {
      container.rebind(FormValidator).toConstantValue(instance(mockedFormValidator))
      container.rebind(SessionService).toConstantValue(instance(session))
    })

    const res = await request(app).post(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI)
      .send(testObject)
      .expect(MOVED_TEMPORARILY)
      .expect('Location', REDIRECT_GATE_URI)
  })
})

it('should render view with errors displayed if validator returns errors', async () => {
  const testObject: EndorseCertificateFormModel = { confirmation: 'understood' }
  const mockError: ValidationErrors = {
    confirmation: `Test confirmation error`
  }
  const mockedDissolutionService = mock(DissolutionService)
  when(mockedDissolutionService.approveDissolution(TOKEN, anything(), anything())).thenResolve()

  const mockedFormValidator = mock(FormValidator)
  when(mockedFormValidator.validate(deepEqual(testObject), formSchema)).thenReturn(mockError)
  const app = createApp(container => {
    container.rebind(FormValidator).toConstantValue(instance(mockedFormValidator))
  })

  await request(app).post(ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI).send(testObject).expect(BAD_REQUEST)
})
})
