import { Application } from "express"
import { Container } from "inversify"
import { InversifyExpressServer } from "inversify-express-utils"
import ServerMiddlewareLoader from "./middleware/serverMiddlewareLoader.middleware"

export function createInversifyExpressServer (container: Container): Application {
    const middlewareLoader: ServerMiddlewareLoader = container.get(ServerMiddlewareLoader)

    return new InversifyExpressServer(container)
        .setConfig((app: Application) => middlewareLoader.loadServerMiddleware(app, __dirname))
        .setErrorConfig((app: Application) => middlewareLoader.configureErrorHandling(app))
        .build()
}
