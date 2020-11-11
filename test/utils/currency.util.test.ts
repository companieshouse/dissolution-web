import 'reflect-metadata'

import { assert } from 'chai'

import convertToCurrency from 'app/utils/currencyConverter.util'

describe('CurrencyConverter', () => {
  it('should return the correct currency value if the value is 8', () => {
    const currency: string = convertToCurrency(8)

    assert.equal('£8.00', currency)
  })

  it('should return the correct currency value if the value is 8.00', () => {
    const currency: string = convertToCurrency(8.00)

    assert.equal('£8.00', currency)
  })
})
