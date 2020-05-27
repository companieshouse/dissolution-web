import 'reflect-metadata'

import { assert } from 'chai'
import { Application } from 'express'
import { BAD_REQUEST, MOVED_TEMPORARILY } from 'http-status-codes'
import { deepEqual, instance, mock, when } from 'ts-mockito'
import { createApp } from '../application.factory'

import 'app/controllers/form.controller'
import ValidationErrors from 'app/models/validationErrors'
import { FORM_PAGE_URI } from 'app/paths'
import formSchema from 'app/schemas/form.schema'
import FormValidator from 'app/utils/formValidator.util'

import { setupSuperTest } from 'test/supertest.factory'


describe('FormController', () => {
  it('should redirect successfully if validator returns no errors', async () => {
    const mockedFormValidator = mock(FormValidator)

    const app: Application = createApp(container => {
      container.rebind(FormValidator).toConstantValue(instance(mockedFormValidator))
    })
    const req = setupSuperTest(app)
    const testObject = {test: 'data'}

    when(mockedFormValidator.validate(deepEqual(testObject), formSchema)).thenReturn(null)

    const res = await req.post(FORM_PAGE_URI).send(testObject).expect(MOVED_TEMPORARILY)

    assert.include(res.text, 'Found. Redirecting to /form')
  })

  it('should render view with errors displayed if validator returns errors', async () => {
    const mockedFormValidator = mock(FormValidator)
    const app: Application = createApp(container => {
      container.rebind(FormValidator).toConstantValue(instance(mockedFormValidator))
    })
    const req = setupSuperTest(app)
    const testData = {test: 'data'}

    const mockError: ValidationErrors = {
      someTextField: 'You must enter at least 3 characters'
    }

    when(mockedFormValidator.validate(deepEqual(testData), formSchema)).thenReturn(mockError)

    const res = await req.post(FORM_PAGE_URI).send(testData).expect(BAD_REQUEST)

    assert.include(res.text, 'You must enter at least 3 characters')

  })
})
