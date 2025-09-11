import * as tsConfigPaths from "tsconfig-paths"
import * as path from "path"

const getPaths = (): { [key: string]: string[] } => {
    try {
        const tsConfig = require(path.join(__dirname, "../tsconfig.json"))
        return tsConfig?.compilerOptions?.paths || { "app/*": ["./*"] }
    } catch (_e) {
        return { "app/*": ["./*"] }
    }
}

tsConfigPaths.register({
    baseUrl: __dirname,
    paths: getPaths()
})
