import 'reflect-metadata'

import { assert } from 'chai'
import { Application } from 'express'
import { StatusCodes } from 'http-status-codes'
import request from 'supertest'
import { anything, instance, mock, when } from 'ts-mockito'
import { generateDissolutionGetResponse } from '../fixtures/dissolutionApi.fixtures'
import { TOKEN } from '../fixtures/session.fixtures'
import { generateViewApplicationStatusModel, generateViewApplicationStatusSignatory } from '../fixtures/viewApplicationStatus.fixtures'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/waitForOthersToSign.controller'
import ViewApplicationStatusMapper from 'app/mappers/view-application-status/viewApplicationStatus.mapper'
import ApplicationStatus from 'app/models/dto/applicationStatus.enum'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse'
import OfficerType from 'app/models/dto/officerType.enum'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { ViewApplicationStatus } from 'app/models/view/viewApplicationStatus.model'
import { APPLICATION_STATUS_URI, PAYMENT_REVIEW_URI, WAIT_FOR_OTHERS_TO_SIGN_URI } from 'app/paths'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import SessionService from 'app/services/session/session.service'

import { generateDissolutionSession } from 'test/fixtures/session.fixtures'

let session: SessionService
let dissolutionService: DissolutionService
let viewApplicationStatusMapper: ViewApplicationStatusMapper

const COMPANY_NUMBER = '01777777'

let app: Application

let dissolutionSession: DissolutionSession
let dissolution: DissolutionGetResponse
let viewApplicationStatus: ViewApplicationStatus

beforeEach(() => {
  session = mock(SessionService)
  dissolutionService = mock(DissolutionService)
  viewApplicationStatusMapper = mock(ViewApplicationStatusMapper)

  dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
  dissolution = generateDissolutionGetResponse()
  viewApplicationStatus = generateViewApplicationStatusModel()

  when(session.getAccessToken(anything())).thenReturn(TOKEN)
  when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
  when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)
  when(viewApplicationStatusMapper.mapToViewModel(dissolutionSession, dissolution, true)).thenReturn(viewApplicationStatus)

  app = createApp(container => {
    container.rebind(SessionService).toConstantValue(instance(session))
    container.rebind(DissolutionService).toConstantValue(instance(dissolutionService))
    container.rebind(ViewApplicationStatusMapper).toConstantValue(instance(viewApplicationStatusMapper))
  })
})

describe('WaitForOthersToSignController', () => {
  describe('GET request', () => {
    it('should render the WaitForOthers page with director text when company is plc', async () => {
      dissolutionSession.officerType = OfficerType.DIRECTOR

      const res = await request(app)
        .get(WAIT_FOR_OTHERS_TO_SIGN_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'The directors must sign the application before you can submit it'))
      assert.isTrue(htmlAssertHelper.hasText('#email', 'We have emailed the directors, or those signing on their behalf, asking them to sign the application. It may take some time for them to do this.'))
      assert.isTrue(htmlAssertHelper.hasText('#signed', 'When all directors have signed, we will email you with instructions to pay for and submit the application.'))
    })

    it('should render the WaitForOthers page with member text when company is llp', async () => {
      dissolutionSession.officerType = OfficerType.MEMBER

      const res = await request(app)
        .get(WAIT_FOR_OTHERS_TO_SIGN_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'The members must sign the application before you can submit it'))
      assert.isTrue(htmlAssertHelper.hasText('#email', 'We have emailed the members, or those signing on their behalf, asking them to sign the application. It may take some time for them to do this.'))
      assert.isTrue(htmlAssertHelper.hasText('#signed', 'When all members have signed, we will email you with instructions to pay for and submit the application.'))
    })

    it('should redirect applicant to the Payment Review page if all the signatories have signed', async () => {
      dissolution.application_status = ApplicationStatus.PENDING_PAYMENT

      await request(app)
        .get(WAIT_FOR_OTHERS_TO_SIGN_URI)
        .expect(StatusCodes.MOVED_TEMPORARILY)
        .expect('Location', PAYMENT_REVIEW_URI)
    })

    describe('View Application Status', () => {
      it('should display each signatory on a separate row', async () => {
        viewApplicationStatus.signatories = [
          generateViewApplicationStatusSignatory(),
          generateViewApplicationStatusSignatory(),
        ]

        const res = await request(app)
          .get(WAIT_FOR_OTHERS_TO_SIGN_URI)
          .expect(StatusCodes.OK)

        const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

        assert.isTrue(htmlAssertHelper.selectorExists('#name-0'))
        assert.isTrue(htmlAssertHelper.selectorExists('#name-1'))
        assert.isTrue(htmlAssertHelper.selectorDoesNotExist('#name-2'))
      })

      it('should display the signatory info correctly', async () => {
        viewApplicationStatus.signatories = [
          { ...generateViewApplicationStatusSignatory(), name: 'Jane Smith', email: 'jane@mail.com' },
          { ...generateViewApplicationStatusSignatory(), name: 'John Doe', email: 'john@mail.com' }
        ]

        const res = await request(app)
          .get(WAIT_FOR_OTHERS_TO_SIGN_URI)
          .expect(StatusCodes.OK)

        const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

        assert.isTrue(htmlAssertHelper.hasText('#name-0', 'Jane Smith'))
        assert.isTrue(htmlAssertHelper.hasText('#email-0', 'jane@mail.com'))

        assert.isTrue(htmlAssertHelper.hasText('#name-1', 'John Doe'))
        assert.isTrue(htmlAssertHelper.hasText('#email-1', 'john@mail.com'))
      })

      it('should display the correct signed status for each signatory', async () => {
        viewApplicationStatus.signatories = [
          { ...generateViewApplicationStatusSignatory(), hasApproved: true },
          { ...generateViewApplicationStatusSignatory(), hasApproved: false }
        ]

        const res = await request(app)
          .get(WAIT_FOR_OTHERS_TO_SIGN_URI)
          .expect(StatusCodes.OK)

        const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

        assert.isTrue(htmlAssertHelper.hasText('#signed-0 .govuk-tag', 'Signed'))
        assert.isTrue(htmlAssertHelper.hasText('#signed-1 .govuk-tag', 'Not signed'))
      })

      describe('change', () => {
        it('should display the change column', async () => {
          viewApplicationStatus.showChangeColumn = true

          const res = await request(app)
            .get(WAIT_FOR_OTHERS_TO_SIGN_URI)
            .expect(StatusCodes.OK)

          const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

          assert.isTrue(htmlAssertHelper.selectorExists('#change-col'))
        })

        it('should display the change link beside each editable signatory', async () => {
          viewApplicationStatus.showChangeColumn = true
          viewApplicationStatus.signatories = [
            { ...generateViewApplicationStatusSignatory(), canChange: true, id: 'abc123' },
            { ...generateViewApplicationStatusSignatory(), canChange: false }
          ]

          const res = await request(app)
            .get(WAIT_FOR_OTHERS_TO_SIGN_URI)
            .expect(StatusCodes.OK)

          const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

          assert.isTrue(htmlAssertHelper.selectorExists('#change-0'))
          assert.equal(htmlAssertHelper.getAttributeValue('#change-0 a', 'href'), `${APPLICATION_STATUS_URI}/abc123/change`)
          assert.isTrue(htmlAssertHelper.selectorDoesNotExist('#change-1'))
        })
      })
    })
  })
})
