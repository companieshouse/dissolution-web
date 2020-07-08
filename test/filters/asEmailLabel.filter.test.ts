import { assert } from 'chai'

import { asEmailLabel } from 'app/filters/asEmailLabel.filter'
describe('asEmailLabelFilter', () => {
  it(`should return 'Email address' when director is signing`, () => {
    assert.equal('Email address', asEmailLabel('Yes'))
  })

  it(`should return 'Email address of person signing' when director is signing`, () => {
    assert.equal('Email address of person signing', asEmailLabel('No'))
  })
})