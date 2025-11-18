import "reflect-metadata"

import { assert } from "chai"

import convertToCurrency from "app/utils/currencyConverter.util"

describe("CurrencyConverter", () => {
    it("should return the correct currency value if the value is 13", () => {
        const currency: string = convertToCurrency(13)

        assert.equal("£13.00", currency)
    })

    it("should return the correct currency value if the value is 13.00", () => {
        const currency: string = convertToCurrency(13.00)

        assert.equal("£13.00", currency)
    })
})
