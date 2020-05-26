import { assert } from 'chai'

import { asGovUKErrorList, GovUKError } from 'app/filters/asGovUKErrorList.filter'
import ValidationErrors from 'app/models/validationErrors'

describe('asGovUKErrorListFilter', () => {
  it('should transform validationErrors object to a list of GovUKErrors', () => {
    const validationErrors: ValidationErrors = {
      someTextField: 'You must enter at least 3 characters',
      someEmailField: 'You must enter a valid email address'
    }

    const govUKErrorList: GovUKError[] =
      [
        {
          href: '#some-text-field',
          text: 'You must enter at least 3 characters'
        },
        {
          href: '#some-email-field',
          text: 'You must enter a valid email address'
        }
      ]

    assert.deepEqual(asGovUKErrorList(validationErrors), govUKErrorList)
  })

  it('should throw TypeError if null or undefined are passed as an argument', () => {
    assert.throw(() => {
      asGovUKErrorList(null as any)
    }, TypeError, 'Cannot convert undefined or null to object')

    assert.throw(() => {
      asGovUKErrorList(undefined as any)
    }, TypeError, 'Cannot convert undefined or null to object')
  })

  it('should return empty array if empty object is passed as an argument', () => {
    assert.deepEqual(asGovUKErrorList({}), [])
  })
})
