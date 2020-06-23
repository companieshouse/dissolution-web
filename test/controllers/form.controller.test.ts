import 'reflect-metadata'

import { assert } from 'chai'
import { BAD_REQUEST, MOVED_TEMPORARILY, OK } from 'http-status-codes'
import request from 'supertest'
import { deepEqual, instance, mock, when } from 'ts-mockito'
import { createApp } from './helpers/application.factory'

import 'app/controllers/form.controller'
import ValidationErrors from 'app/models/view/validationErrors.model'
import { FORM_PAGE_URI } from 'app/paths'
import formSchema from 'app/schemas/form.schema'
import FormValidator from 'app/utils/formValidator.util'

describe('FormController', () => {
  describe('GET - ensure that page loads correctly', () => {
    it('should render the form page', async () => {
      const app = createApp()

      const res = await request(app).get(FORM_PAGE_URI).expect(OK)

      assert.include(res.text, 'Tell us some details')
    })
  })

  describe('POST - ensure form submission is handled correctly', () => {
    it('should redirect successfully if validator returns no errors', async () => {
      const testObject = {test: 'data'}

      const mockedFormValidator = mock(FormValidator)
      when(mockedFormValidator.validate(deepEqual(testObject), formSchema)).thenReturn(null)

      const app = createApp(container => {
        container.rebind(FormValidator).toConstantValue(instance(mockedFormValidator))
      })

      const res = await request(app).post(FORM_PAGE_URI).send(testObject).expect(MOVED_TEMPORARILY)

      assert.include(res.text, 'Found. Redirecting to /close-a-company/form')
    })
  })

  it('should render view with errors displayed if validator returns errors', async () => {
    const testData = {test: 'data'}
    const mockError: ValidationErrors = {
      someTextField: 'You must enter at least 3 characters'
    }

    const mockedFormValidator = mock(FormValidator)
    when(mockedFormValidator.validate(deepEqual(testData), formSchema)).thenReturn(mockError)
    const app = createApp(container => {
      container.rebind(FormValidator).toConstantValue(instance(mockedFormValidator))
    })

    const res = await request(app).post(FORM_PAGE_URI).send(testData).expect(BAD_REQUEST)

    assert.include(res.text, 'You must enter at least 3 characters')
  })
})
