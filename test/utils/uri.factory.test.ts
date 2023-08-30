import "reflect-metadata"

import { assert } from "chai"

import UriFactory from "app/utils/uri.factory"

describe("UriFactory", () => {
    it("should return absolute uri", () => {
        const req = {
            protocol: "http",
            headers: {
                host: "www.example.com"
            }
        }
        const uriFactory = new UriFactory()
        const uri = uriFactory.createAbsoluteUri(req as any, "example-page")

        assert.equal(uri, "http://www.example.com/example-page")
    })

})
