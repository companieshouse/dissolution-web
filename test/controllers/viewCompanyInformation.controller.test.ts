import 'reflect-metadata'

import { assert } from 'chai'
import { MOVED_TEMPORARILY, OK } from 'http-status-codes'
import request from 'supertest'
import { anything, instance, mock, when } from 'ts-mockito'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/viewCompanyInformation.controller'
import CompanyDetails from 'app/models/companyDetails.model'
import ClosableCompanyType from 'app/models/mapper/closableCompanyType.enum'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { REDIRECT_GATE_URI, VIEW_COMPANY_INFORMATION_URI } from 'app/paths'
import CompanyService from 'app/services/company/company.service'
import SessionService from 'app/services/session/session.service'

import { generateCompanyDetails } from 'test/fixtures/companyProfile.fixtures'
import { generateDissolutionSession } from 'test/fixtures/session.fixtures'

describe('ViewCompanyInformationController', () => {

  let session: SessionService
  let companyService: CompanyService

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '01777777'

  let dissolutionSession: DissolutionSession

  beforeEach(() => {
    session = mock(SessionService)
    companyService = mock(CompanyService)

    dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)

    when(session.getAccessToken(anything())).thenReturn(TOKEN)
    when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
  })

  describe('GET request', () => {
    it('should render the view company information page with company info', async () => {
      when(companyService.getCompanyDetails(TOKEN, COMPANY_NUMBER)).thenResolve(generateCompanyDetails())

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyService).toConstantValue(instance(companyService))
      })

      const res = await request(app)
        .get(VIEW_COMPANY_INFORMATION_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('h1', 'View company information'))
    })

    it('should populate the company details', async () => {
      const company: CompanyDetails = generateCompanyDetails()
      company.companyNumber = COMPANY_NUMBER
      company.companyName = 'Some company name'
      company.companyStatus = 'active'
      company.companyType = ClosableCompanyType.LTD
      company.companyRegOffice = 'some address'
      company.companyIncDate = '2020-06-24T13:51:57.623Z'

      when(companyService.getCompanyDetails(TOKEN, COMPANY_NUMBER)).thenResolve(company)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyService).toConstantValue(instance(companyService))
      })

      const res = await request(app)
        .get(VIEW_COMPANY_INFORMATION_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('#company-number-header', 'Company number'))
      assert.isTrue(htmlAssertHelper.hasText('#company-number-value', COMPANY_NUMBER))

      assert.isTrue(htmlAssertHelper.hasText('#company-name', 'SOME COMPANY NAME'))

      assert.isTrue(htmlAssertHelper.hasText('#company-status-header', 'Status'))
      assert.isTrue(htmlAssertHelper.hasText('#company-status-value', 'Active'))

      assert.isTrue(htmlAssertHelper.hasText('#company-incorporation-date-header', 'Incorporation date'))
      assert.isTrue(htmlAssertHelper.hasText('#company-incorporation-date-value', '24 Jun 2020'))

      assert.isTrue(htmlAssertHelper.hasText('#company-type-header', 'Company type'))
      assert.isTrue(htmlAssertHelper.hasText('#company-type-value', 'Private limited company'))


      assert.isTrue(htmlAssertHelper.hasText('#company-address-header', 'Registered office address'))
      assert.isTrue(htmlAssertHelper.hasText('#company-address-value', 'some address'))
    })

    it('should display the continue button and not show an error when company is closable', async () => {
      const company: CompanyDetails = generateCompanyDetails()
      company.canClose = true

      when(companyService.getCompanyDetails(TOKEN, COMPANY_NUMBER)).thenResolve(company)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyService).toConstantValue(instance(companyService))
      })

      const res = await request(app)
        .get(VIEW_COMPANY_INFORMATION_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.selectorExists('#submit'))
      assert.isTrue(htmlAssertHelper.selectorDoesNotExist('#cannot-close-error'))
    })

    it('should not display the continue button and show an error when company is not closable', async () => {
      const company: CompanyDetails = generateCompanyDetails()
      company.canClose = false

      when(companyService.getCompanyDetails(TOKEN, COMPANY_NUMBER)).thenResolve(company)

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyService).toConstantValue(instance(companyService))
      })

      const res = await request(app)
        .get(VIEW_COMPANY_INFORMATION_URI)
        .expect(OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.selectorDoesNotExist('#submit'))
      assert.isTrue(htmlAssertHelper.selectorExists('#cannot-close-error'))
    })
  })

  describe('POST request', () => {
    it('should redirect to the select director screen upon submission', async () => {
      await request(createApp())
        .post(VIEW_COMPANY_INFORMATION_URI)
        .expect(MOVED_TEMPORARILY)
        .expect('Location', REDIRECT_GATE_URI)
    })
  })
})
