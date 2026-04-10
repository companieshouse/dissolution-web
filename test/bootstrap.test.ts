import { expect } from "chai"
import sinon from "sinon"
import { getPaths } from "app/bootstrap"

const DEFAULT_PATHS = { "app/*": ["./*"] }

const stubTsConfigLoad = (mock: any, throwError = false) => {
    const Module = require("module")
    const originalLoad = Module._load

    return sinon.stub(Module, "_load").callsFake((request: string, parent: any) => {
        if (request.endsWith("tsconfig.json")) {
            if (throwError) {
                const err = new Error("Cannot find module")
                ;(err as any).code = "MODULE_NOT_FOUND"
                throw err
            }
            return mock
        }
        return originalLoad(request, parent)
    })
}

describe("getPaths", () => {
    afterEach(() => sinon.restore())

    it("returns paths when tsconfig has valid compilerOptions.paths", () => {
        const mock = { compilerOptions: { paths: { "app/*": ["./*"], "test/*": ["../test/*"] } } }
        stubTsConfigLoad(mock)
        expect(getPaths()).to.deep.equal(mock.compilerOptions.paths)
    })

    it("returns DEFAULT_PATHS when tsconfig missing", () => {
        stubTsConfigLoad(null, true)
        expect(getPaths()).to.deep.equal(DEFAULT_PATHS)
    })

    it("returns DEFAULT_PATHS when paths = null", () => {
        stubTsConfigLoad({ compilerOptions: { paths: null } })
        expect(getPaths()).to.deep.equal(DEFAULT_PATHS)
    })

    it("returns DEFAULT_PATHS when paths = undefined", () => {
        stubTsConfigLoad({ compilerOptions: { paths: undefined } })
        expect(getPaths()).to.deep.equal(DEFAULT_PATHS)
    })

    it("returns DEFAULT_PATHS when paths = false", () => {
        stubTsConfigLoad({ compilerOptions: { paths: false } })
        expect(getPaths()).to.deep.equal(DEFAULT_PATHS)
    })

    it("returns empty object when paths = {}", () => {
        stubTsConfigLoad({ compilerOptions: { paths: {} } })
        expect(getPaths()).to.deep.equal({})
    })

    it("returns DEFAULT_PATHS when paths is invalid type (string)", () => {
        stubTsConfigLoad({ compilerOptions: { paths: "invalid" } })
        expect(getPaths()).to.deep.equal(DEFAULT_PATHS)
    })

    it("returns DEFAULT_PATHS when tsconfig = null (no throw)", () => {
        stubTsConfigLoad(null, false)
        expect(getPaths()).to.deep.equal(DEFAULT_PATHS)
    })

    it("returns DEFAULT_PATHS when compilerOptions is null/undefined", () => {
        stubTsConfigLoad({ compilerOptions: null })
        expect(getPaths()).to.deep.equal(DEFAULT_PATHS)
    })
})
