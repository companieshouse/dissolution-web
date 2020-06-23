import { ValidationResult } from '@hapi/joi'
import { assert } from 'chai'

import WhoToTellFormModel from 'app/models/form/whoToTell.model'
import formSchema from 'app/schemas/whoToTell.schema'

describe('Who To Tell Schema', () => {

  it('should return no errors when data is valid', () => {
    const validForm: WhoToTellFormModel = {
      confirmation: 'understdood'
    }

    const errors: ValidationResult = formSchema.validate(validForm)

    assert.isUndefined(errors.error)
  })

  it('should return errors when data has missing properties', () => {
    const validForm: WhoToTellFormModel = {
    }

    const errors: ValidationResult = formSchema.validate(validForm)

    assert.deepEqual(errors.value, {})
    assert.equal(errors.error!.details.length, 1)
    assert.equal(errors.error!.details[0].context!.key, 'confirmation')
  })
})
