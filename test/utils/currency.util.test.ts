import "reflect-metadata"

import { assert } from "chai"

import convertToCurrency from "app/utils/currencyConverter.util"

describe("CurrencyConverter", () => {
    it("should return the correct currency value if the value is 33", () => {
        const currency: string = convertToCurrency(33)

        assert.equal("£33.00", currency)
    })

    it("should return the correct currency value if the value is 33.00", () => {
        const currency: string = convertToCurrency(33.00)

        assert.equal("£33.00", currency)
    })
})
