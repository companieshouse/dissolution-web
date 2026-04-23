import "reflect-metadata"

import { assert } from "chai"

import { buildPath } from "app/utils/buildPath"

describe("buildPath", () => {
    it("when all params provided then replaces placeholders and encodes values", () => {
        const template = "/foo/:id/bar/:name"
        const result = buildPath(template, { id: "123", name: "A B" })

        assert.equal(result, "/foo/123/bar/A%20B")
    })

    it("when param contains characters that need encoding then returns encoded segment", () => {
        const template = "/items/:sku"
        const result = buildPath(template, { sku: "a/b?c&d" })

        assert.equal(result, "/items/a%2Fb%3Fc%26d")
    })

    it("when numeric param provided then converts to string", () => {
        const template = "/count/:num"
        const result = buildPath(template, { num: 42 })

        assert.equal(result, "/count/42")
    })

    it("when a required param is missing then throws an informative error", () => {
        const template = "/one/:present/two/:missing"

        assert.throws(() => buildPath(template, { present: "x" }), Error, "Missing route params")
    })
})

