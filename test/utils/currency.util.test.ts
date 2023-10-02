import "reflect-metadata"

import { assert } from "chai"

import convertToCurrency from "app/utils/currencyConverter.util"

describe("CurrencyConverter", () => {
    it("should return the correct currency value if the value is 29", () => {
        const currency: string = convertToCurrency(29)

        assert.equal("£29.00", currency)
    })

    it("should return the correct currency value if the value is 29.00", () => {
        const currency: string = convertToCurrency(29.00)

        assert.equal("£29.00", currency)
    })
})
