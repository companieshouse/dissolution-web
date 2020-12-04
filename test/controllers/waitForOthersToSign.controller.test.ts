import 'reflect-metadata'

import { assert } from 'chai'
import { Application } from 'express'
import { StatusCodes } from 'http-status-codes'
import request from 'supertest'
import { anything, instance, mock, when } from 'ts-mockito'
import { generateDissolutionGetResponse, generateGetDirector } from '../fixtures/dissolutionApi.fixtures'
import { TOKEN } from '../fixtures/session.fixtures'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/waitForOthersToSign.controller'
import DissolutionGetResponse from 'app/models/dto/dissolutionGetResponse.ts'
import OfficerType from 'app/models/dto/officerType.enum'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { WAIT_FOR_OTHERS_TO_SIGN_URI } from 'app/paths'
import DissolutionService from 'app/services/dissolution/dissolution.service'
import SessionService from 'app/services/session/session.service'

import { generateDissolutionSession } from 'test/fixtures/session.fixtures'

let session: SessionService
let dissolutionService: DissolutionService

const COMPANY_NUMBER = '01777777'

let app: Application
let dissolutionSession: DissolutionSession
let dissolution: DissolutionGetResponse

beforeEach(() => {
  session = mock(SessionService)
  dissolutionService = mock(DissolutionService)

  dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)
  dissolution = generateDissolutionGetResponse()

  when(session.getAccessToken(anything())).thenReturn(TOKEN)
  when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
  when(dissolutionService.getDissolution(TOKEN, dissolutionSession)).thenResolve(dissolution)

  app = createApp(container => {
    container.rebind(SessionService).toConstantValue(instance(session))
    container.rebind(DissolutionService).toConstantValue(instance(dissolutionService))
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
      assert.isTrue(htmlAssertHelper.hasText('#email', 'We will email the directors and ask them to sign the application.'))
      assert.isTrue(htmlAssertHelper.hasText('#signed', 'When all directors have signed, we will email you with instructions to pay for and submit the application.'))
    })

    it('should render the WaitForOthers page with member text when company is llp', async () => {
      dissolutionSession.officerType = OfficerType.MEMBER

      const res = await request(app)
        .get(WAIT_FOR_OTHERS_TO_SIGN_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'The members must sign the application before you can submit it'))
      assert.isTrue(htmlAssertHelper.hasText('#email', 'We will email the members and ask them to sign the application.'))
      assert.isTrue(htmlAssertHelper.hasText('#signed', 'When all members have signed, we will email you with instructions to pay for and submit the application.'))
    })

    it('should display three signatories who all have not signed on the Application status table', async () => {
      dissolution.directors = [
        generateGetDirector('Adam Adams'),
        generateGetDirector('Bob Bobby'),
        generateGetDirector('Carl Carlton')
      ]

      const res = await request(app)
        .get(WAIT_FOR_OTHERS_TO_SIGN_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('#name-0', 'Adam Adams'))
      assert.isTrue(htmlAssertHelper.hasText('#email-0', 'adama@company.com'))
      assert.isTrue(htmlAssertHelper.containsText('#signed-0', 'Not signed'))
      assert.isTrue(htmlAssertHelper.hasClass('#signed-0 strong', 'govuk-tag govuk-tag--grey'))

      assert.isTrue(htmlAssertHelper.hasText('#name-1', 'Bob Bobby'))
      assert.isTrue(htmlAssertHelper.hasText('#email-1', 'bobb@company.com'))
      assert.isTrue(htmlAssertHelper.containsText('#signed-1', 'Not signed'))
      assert.isTrue(htmlAssertHelper.hasClass('#signed-1 strong', 'govuk-tag govuk-tag--grey'))

      assert.isTrue(htmlAssertHelper.hasText('#name-2', 'Carl Carlton'))
      assert.isTrue(htmlAssertHelper.hasText('#email-2', 'carlc@company.com'))
      assert.isTrue(htmlAssertHelper.containsText('#signed-2', 'Not signed'))
      assert.isTrue(htmlAssertHelper.hasClass('#signed-2 strong', 'govuk-tag govuk-tag--grey'))
    })

    it('should display two signatories who have signed and one who has not signed on the Application status table', async () => {
      dissolution.directors = [
        generateGetDirector('Adam Adams', 'some-approved-at-timestamp'),
        generateGetDirector('Bob Bobby', 'some-approved-at-timestamp'),
        generateGetDirector('Carl Carlton')
      ]

      const res = await request(app)
        .get(WAIT_FOR_OTHERS_TO_SIGN_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('#name-0', 'Adam Adams'))
      assert.isTrue(htmlAssertHelper.hasText('#email-0', 'adama@company.com'))
      assert.isTrue(htmlAssertHelper.containsText('#signed-0', 'Signed'))
      assert.isTrue(htmlAssertHelper.hasClass('#signed-0 strong', 'govuk-tag'))

      assert.isTrue(htmlAssertHelper.hasText('#name-1', 'Bob Bobby'))
      assert.isTrue(htmlAssertHelper.hasText('#email-1', 'bobb@company.com'))
      assert.isTrue(htmlAssertHelper.containsText('#signed-1', 'Signed'))
      assert.isTrue(htmlAssertHelper.hasClass('#signed-1 strong', 'govuk-tag'))

      assert.isTrue(htmlAssertHelper.hasText('#name-2', 'Carl Carlton'))
      assert.isTrue(htmlAssertHelper.hasText('#email-2', 'carlc@company.com'))
      assert.isTrue(htmlAssertHelper.containsText('#signed-2', 'Not signed'))
      assert.isTrue(htmlAssertHelper.hasClass('#signed-2 strong', 'govuk-tag govuk-tag--grey'))
    })

    it('should display three signatories who all have signed on the Application status table', async () => {
      dissolution.directors = [
        generateGetDirector('Adam Adams', 'some-approved-at-timestamp'),
        generateGetDirector('Bob Bobby', 'some-approved-at-timestamp'),
        generateGetDirector('Carl Carlton', 'some-approved-at-timestamp')
      ]

      const res = await request(app)
        .get(WAIT_FOR_OTHERS_TO_SIGN_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('#name-0', 'Adam Adams'))
      assert.isTrue(htmlAssertHelper.hasText('#email-0', 'adama@company.com'))
      assert.isTrue(htmlAssertHelper.containsText('#signed-0', 'Signed'))
      assert.isTrue(htmlAssertHelper.hasClass('#signed-0 strong', 'govuk-tag'))

      assert.isTrue(htmlAssertHelper.hasText('#name-1', 'Bob Bobby'))
      assert.isTrue(htmlAssertHelper.hasText('#email-1', 'bobb@company.com'))
      assert.isTrue(htmlAssertHelper.containsText('#signed-1', 'Signed'))
      assert.isTrue(htmlAssertHelper.hasClass('#signed-1 strong', 'govuk-tag'))

      assert.isTrue(htmlAssertHelper.hasText('#name-2', 'Carl Carlton'))
      assert.isTrue(htmlAssertHelper.hasText('#email-2', 'carlc@company.com'))
      assert.isTrue(htmlAssertHelper.containsText('#signed-2', 'Signed'))
      assert.isTrue(htmlAssertHelper.hasClass('#signed-2 strong', 'govuk-tag'))
    })

    it('should display three signatories, one who has signed, one signing on behalf of someone who has signed, and one signing on behalf of someone who has not signed on the Application status table', async () => {
      dissolution.directors = [
        generateGetDirector('Adam Adams', 'some-approved-at-timestamp'),
        generateGetDirector('Bob Bobby', 'some-approved-at-timestamp', 'Dennis Dawson'),
        generateGetDirector('Carl Carlton', '', 'Ed Edwards')
      ]

      const res = await request(app)
        .get(WAIT_FOR_OTHERS_TO_SIGN_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('#name-0', 'Adam Adams'))
      assert.isTrue(htmlAssertHelper.hasText('#email-0', 'adama@company.com'))
      assert.isTrue(htmlAssertHelper.containsText('#signed-0', 'Signed'))
      assert.isTrue(htmlAssertHelper.hasClass('#signed-0 strong', 'govuk-tag'))

      assert.isTrue(htmlAssertHelper.hasText('.on_behalf_name_1', 'Dennis Dawson'))
      assert.isTrue(htmlAssertHelper.hasText('.on_behalf_of_signatory_name_section_1', 'signing on behalf of Bob Bobby'))
      assert.isTrue(htmlAssertHelper.hasText('#email-1', 'bobb@company.com'))
      assert.isTrue(htmlAssertHelper.containsText('#signed-1', 'Signed'))
      assert.isTrue(htmlAssertHelper.hasClass('#signed-1 strong', 'govuk-tag'))

      assert.isTrue(htmlAssertHelper.hasText('.on_behalf_name_2', 'Ed Edwards'))
      assert.isTrue(htmlAssertHelper.hasText('.on_behalf_of_signatory_name_section_2', 'signing on behalf of Carl Carlton'))
      assert.isTrue(htmlAssertHelper.hasText('#email-2', 'carlc@company.com'))
      assert.isTrue(htmlAssertHelper.containsText('#signed-2', 'Not signed'))
      assert.isTrue(htmlAssertHelper.hasClass('#signed-2 strong', 'govuk-tag govuk-tag--grey'))
    })
  })
})
