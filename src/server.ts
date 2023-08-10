import "reflect-metadata"

import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger"
import { Application } from "express"
import { inject, Container } from "inversify"
import { provide } from "inversify-binding-decorators"
import { InversifyExpressServer } from "inversify-express-utils"
import ServerMiddlewareLoader from "./middleware/serverMiddlewareLoader.middleware"
import Optional from "./models/optional"

import TYPES from "app/types"

@provide(Server)
export default class Server {

    public constructor (
    @inject(ServerMiddlewareLoader) private middlewareLoader: ServerMiddlewareLoader,
    @inject(TYPES.NODE_ENV) private NODE_ENV: Optional<string>,
    @inject(TYPES.PORT) private PORT: number,
    @inject(ApplicationLogger) private logger: ApplicationLogger) {}

    public start (container: Container): void {
        const server: Application = new InversifyExpressServer(container)
            .setConfig((app: Application) => this.middlewareLoader.loadServerMiddleware(app, __dirname))
            .setErrorConfig((app: Application) => this.middlewareLoader.configureErrorHandling(app))
            .build()

        server.listen(this.PORT, () => this.logStartMessage())
    }

    private logStartMessage (): void {
        this.logger.info(`App is running at http://localhost:${this.PORT} in ${this.NODE_ENV} mode`)
        this.logger.info(`Press CTRL-C to stop\n`)
    }
}
