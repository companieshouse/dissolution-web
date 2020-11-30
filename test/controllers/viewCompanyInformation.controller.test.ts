import 'reflect-metadata'

import { assert } from 'chai'
import { StatusCodes } from 'http-status-codes'
import request from 'supertest'
import { anything, instance, mock, when } from 'ts-mockito'
import { generateDirectorDetails } from '../fixtures/companyOfficers.fixtures'
import { createApp } from './helpers/application.factory'
import HtmlAssertHelper from './helpers/htmlAssert.helper'

import 'app/controllers/viewCompanyInformation.controller'
import CompanyDetails from 'app/models/companyDetails.model'
import ClosableCompanyType from 'app/models/mapper/closableCompanyType.enum'
import OverseasCompanyPrefix from 'app/models/mapper/overseasCompanyPrefix.enum'
import DissolutionSession from 'app/models/session/dissolutionSession.model'
import { REDIRECT_GATE_URI, VIEW_COMPANY_INFORMATION_URI } from 'app/paths'
import CompanyOfficersService from 'app/services/company-officers/companyOfficers.service'
import CompanyService from 'app/services/company/company.service'
import SessionService from 'app/services/session/session.service'

import { generateCompanyDetails } from 'test/fixtures/companyProfile.fixtures'
import { generateDissolutionSession } from 'test/fixtures/session.fixtures'

describe('ViewCompanyInformationController', () => {

  let session: SessionService
  let companyService: CompanyService
  let companyOfficersService: CompanyOfficersService

  const TOKEN = 'some-token'
  const COMPANY_NUMBER = '01777777'

  let dissolutionSession: DissolutionSession

  beforeEach(() => {
    session = mock(SessionService)
    companyService = mock(CompanyService)
    companyOfficersService = mock(CompanyOfficersService)

    dissolutionSession = generateDissolutionSession(COMPANY_NUMBER)

    when(session.getAccessToken(anything())).thenReturn(TOKEN)
    when(session.getDissolutionSession(anything())).thenReturn(dissolutionSession)
  })

  describe('GET request', () => {
    it('should render the view company information page with company info', async () => {
      const company: CompanyDetails = generateCompanyDetails()
      company.companyNumber = COMPANY_NUMBER
      company.companyName = 'Some company name'
      company.companyStatus = 'active'
      company.companyType = ClosableCompanyType.LTD

      when(companyService.getCompanyDetails(TOKEN, COMPANY_NUMBER)).thenResolve(company)
      when(companyOfficersService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([generateDirectorDetails()])

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyService).toConstantValue(instance(companyService))
        container.rebind(CompanyOfficersService).toConstantValue(instance(companyOfficersService))
      })

      const res = await request(app)
        .get(VIEW_COMPANY_INFORMATION_URI)
        .expect(StatusCodes.OK)

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
      when(companyOfficersService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([generateDirectorDetails()])

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyService).toConstantValue(instance(companyService))
        container.rebind(CompanyOfficersService).toConstantValue(instance(companyOfficersService))
      })

      const res = await request(app)
        .get(VIEW_COMPANY_INFORMATION_URI)
        .expect(StatusCodes.OK)

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
      company.companyNumber = COMPANY_NUMBER
      company.companyName = 'Some company name'
      company.companyStatus = 'active'
      company.companyType = ClosableCompanyType.LTD

      when(companyService.getCompanyDetails(TOKEN, COMPANY_NUMBER)).thenResolve(company)
      when(companyOfficersService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([generateDirectorDetails()])

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyService).toConstantValue(instance(companyService))
        container.rebind(CompanyOfficersService).toConstantValue(instance(companyOfficersService))
      })

      const res = await request(app)
        .get(VIEW_COMPANY_INFORMATION_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.selectorExists('#submit'))
      assert.isTrue(htmlAssertHelper.selectorDoesNotExist('#cannot-close-error'))
    })

    it('should not display the continue button and show an error when company is not closable', async () => {
      const company: CompanyDetails = generateCompanyDetails()
      company.companyNumber = COMPANY_NUMBER
      company.companyName = 'Some company name'
      company.companyStatus = 'inactive'
      company.companyType = ClosableCompanyType.LTD

      when(companyService.getCompanyDetails(TOKEN, COMPANY_NUMBER)).thenResolve(company)
      when(companyOfficersService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([generateDirectorDetails()])

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyService).toConstantValue(instance(companyService))
        container.rebind(CompanyOfficersService).toConstantValue(instance(companyOfficersService))

      })

      const res = await request(app)
        .get(VIEW_COMPANY_INFORMATION_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.selectorDoesNotExist('#submit'))
      assert.isTrue(htmlAssertHelper.selectorExists('#cannot-close-error'))
    })

    it('should display error message when company is not of closable type', async () => {
      const company: CompanyDetails = generateCompanyDetails()
      company.companyNumber = COMPANY_NUMBER
      company.companyName = 'Some company name'
      company.companyStatus = 'active'
      company.companyType = 'chicken'

      when(companyService.getCompanyDetails(TOKEN, COMPANY_NUMBER)).thenResolve(company)
      when(companyOfficersService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([generateDirectorDetails()])

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyService).toConstantValue(instance(companyService))
        container.rebind(CompanyOfficersService).toConstantValue(instance(companyOfficersService))
      })

      const res = await request(app)
        .get(VIEW_COMPANY_INFORMATION_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.containsText('#cannot-close-error-message', 'Company type of chicken cannot be closed via this service.'))
    })

    it('should display error message when company is not active', async () => {
      const company: CompanyDetails = generateCompanyDetails()
      company.companyNumber = COMPANY_NUMBER
      company.companyName = 'Some company name'
      company.companyStatus = 'inactive'
      company.companyType = ClosableCompanyType.LLP

      when(companyService.getCompanyDetails(TOKEN, COMPANY_NUMBER)).thenResolve(company)
      when(companyOfficersService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([generateDirectorDetails()])

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyService).toConstantValue(instance(companyService))
        container.rebind(CompanyOfficersService).toConstantValue(instance(companyOfficersService))
      })

      const res = await request(app)
        .get(VIEW_COMPANY_INFORMATION_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('#cannot-close-error-message', 'The company is not currently active and cannot be closed.'))
    })

    it('should display error message when company has an overseas prefix', async () => {
      const company: CompanyDetails = generateCompanyDetails()
      company.companyNumber = OverseasCompanyPrefix.FC + COMPANY_NUMBER
      company.companyName = 'Some company name'
      company.companyStatus = 'active'
      company.companyType = ClosableCompanyType.LLP

      when(companyService.getCompanyDetails(TOKEN, COMPANY_NUMBER)).thenResolve(company)
      when(companyOfficersService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([generateDirectorDetails()])

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyService).toConstantValue(instance(companyService))
        container.rebind(CompanyOfficersService).toConstantValue(instance(companyOfficersService))
      })

      const res = await request(app)
        .get(VIEW_COMPANY_INFORMATION_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('#cannot-close-error-message', 'This is an overseas company, and cannot be closed using this service.'))
    })

    it('should display error message when company has no active directors', async () => {
      const company: CompanyDetails = generateCompanyDetails()
      company.companyNumber = COMPANY_NUMBER
      company.companyName = 'Some company name'
      company.companyStatus = 'active'
      company.companyType = ClosableCompanyType.LLP

      when(companyService.getCompanyDetails(TOKEN, COMPANY_NUMBER)).thenResolve(company)
      when(companyOfficersService.getActiveDirectorsForCompany(TOKEN, COMPANY_NUMBER)).thenResolve([])

      const app = createApp(container => {
        container.rebind(SessionService).toConstantValue(instance(session))
        container.rebind(CompanyService).toConstantValue(instance(companyService))
        container.rebind(CompanyOfficersService).toConstantValue(instance(companyOfficersService))
      })

      const res = await request(app)
        .get(VIEW_COMPANY_INFORMATION_URI)
        .expect(StatusCodes.OK)

      const htmlAssertHelper: HtmlAssertHelper = new HtmlAssertHelper(res.text)

      assert.isTrue(htmlAssertHelper.hasText('#cannot-close-error-message', 'The company has no active members / directors.'))
    })
  })

  describe('POST request', () => {
    it('should redirect to the select director screen upon submission', async () => {
      await request(createApp())
        .post(VIEW_COMPANY_INFORMATION_URI)
        .expect(StatusCodes.MOVED_TEMPORARILY)
        .expect('Location', REDIRECT_GATE_URI)
    })
  })
})
