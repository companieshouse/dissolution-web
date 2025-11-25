import * as tsConfigPaths from "tsconfig-paths"
import * as path from "path"

export const getPaths = (): { [key: string]: string[] } => {
    const DEFAULT_PATHS = { "app/*": ["./*"] }

    try {
        const tsConfig = require(path.join(__dirname, "../tsconfig.json"))
        const paths = tsConfig?.compilerOptions?.paths

        if (paths === null || paths === undefined || paths === false) {
            return DEFAULT_PATHS
        }

        if (typeof paths === "object" && Object.keys(paths).length === 0) {
            return {}
        }

        if (typeof paths === "object") {
            return paths
        }

        return DEFAULT_PATHS
    } catch {
        return DEFAULT_PATHS
    }
}

tsConfigPaths.register({
    baseUrl: __dirname,
    paths: getPaths()
})
