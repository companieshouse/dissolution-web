import { expect } from "chai"
import sinon from "sinon"
import { createRequire } from "module"

// @ts-ignore
const requireModule = createRequire(import.meta.url)
const DEFAULT_PATHS = { "app/*": ["./*"] }

function freshRequire (path: string) {
    const resolved = requireModule.resolve(path)
    delete requireModule.cache[resolved]
    return requireModule(path)
}

const stubTsConfigLoad = (mock: any, throwError = false) => {
    const Module = requireModule("module")
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
        const { getPaths } = freshRequire("../src/bootstrap")
        expect(getPaths()).to.deep.equal(mock.compilerOptions.paths)
    })

    it("returns DEFAULT_PATHS when tsconfig missing", () => {
        stubTsConfigLoad(null, true)
        const { getPaths } = freshRequire("../src/bootstrap")
        expect(getPaths()).to.deep.equal(DEFAULT_PATHS)
    })

    it("returns DEFAULT_PATHS when paths = null", () => {
        stubTsConfigLoad({ compilerOptions: { paths: null } })
        const { getPaths } = freshRequire("../src/bootstrap")
        expect(getPaths()).to.deep.equal(DEFAULT_PATHS)
    })

    it("returns DEFAULT_PATHS when paths = undefined", () => {
        stubTsConfigLoad({ compilerOptions: { paths: undefined } })
        const { getPaths } = freshRequire("../src/bootstrap")
        expect(getPaths()).to.deep.equal(DEFAULT_PATHS)
    })

    it("returns DEFAULT_PATHS when paths = false", () => {
        stubTsConfigLoad({ compilerOptions: { paths: false } })
        const { getPaths } = freshRequire("../src/bootstrap")
        expect(getPaths()).to.deep.equal(DEFAULT_PATHS)
    })

    it("returns empty object when paths = {}", () => {
        stubTsConfigLoad({ compilerOptions: { paths: {} } })
        const { getPaths } = freshRequire("../src/bootstrap")
        expect(getPaths()).to.deep.equal({})
    })

    it("returns DEFAULT_PATHS when paths is invalid type (string)", () => {
        stubTsConfigLoad({ compilerOptions: { paths: "invalid" } })
        const { getPaths } = freshRequire("../src/bootstrap")
        expect(getPaths()).to.deep.equal(DEFAULT_PATHS)
    })
})
