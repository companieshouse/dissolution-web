import { assert } from "chai"
import * as sinon from "sinon"

describe("Bootstrap", () => {
    beforeEach(() => {
        const bootstrapPath = require.resolve("../src/bootstrap")
        delete require.cache[bootstrapPath]
    })

    afterEach(() => {
        sinon.restore()
    })

    describe("getPaths", () => {
        const mockModuleLoad = (mockReturn: any, shouldThrow: boolean = false) => {
            const Module = require("module")
            const originalLoad = Module._load

            return sinon.stub(Module, "_load").callsFake((request: string, parent: any) => {
                if (request.includes("tsconfig.json")) {
                    if (shouldThrow) {
                        throw new Error("Cannot find module")
                    }
                    return mockReturn
                }
                return originalLoad(request, parent)
            })
        }

        it("should return paths from tsconfig.json when file exists and has compilerOptions", () => {
            const expectedPaths = {
                "app/*": ["./*"],
                "test/*": ["../test/*"]
            }
            const mockTsConfig = {
                compilerOptions: {
                    paths: expectedPaths
                }
            }
            mockModuleLoad(mockTsConfig)
            const { getPaths } = require("../src/bootstrap")
            assert.deepEqual(getPaths(), expectedPaths)
        })

        it("should return default paths when tsconfig.json doesn't exist", () => {
            const expectedPaths = { "app/*": ["./*"] }
            mockModuleLoad(null, true)
            const { getPaths } = require("../src/bootstrap")
            assert.deepEqual(getPaths(), expectedPaths)
        })

        it("should return default paths when tsconfig.json exists but has no compilerOptions", () => {
            const expectedPaths = { "app/*": ["./*"] }
            const mockTsConfig = {
                include: ["src/**/*"]
            }
            mockModuleLoad(mockTsConfig)
            const { getPaths } = require("../src/bootstrap")
            assert.deepEqual(getPaths(), expectedPaths)
        })

        it("should return default paths when tsconfig.json exists but has no paths", () => {
            const expectedPaths = { "app/*": ["./*"] }
            const mockTsConfig = {
                compilerOptions: {
                    target: "es6"
                }
            }
            mockModuleLoad(mockTsConfig)
            const { getPaths } = require("../src/bootstrap")
            assert.deepEqual(getPaths(), expectedPaths)
        })
    })
})
