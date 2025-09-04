import "reflect-metadata"

import { Container } from "inversify"
import { Application } from "express"
import "../bootstrap"

import "app/controllers/index"
import initContainer from "app/inversify.config"
import { InversifyExpressServer } from "inversify-express-utils"
import ServerMiddlewareLoader from "../middleware/serverMiddlewareLoader.middleware"

const PORT = 3000

const container: Container = initContainer()
const middlewareLoader = container.get(ServerMiddlewareLoader)

const app: Application = new InversifyExpressServer(container)
    .setConfig((app: Application) => middlewareLoader.loadServerMiddleware(app, __dirname))
    .setErrorConfig((app: Application) => middlewareLoader.configureErrorHandling(app))
    .build()

app.set("port", PORT)

app.listen(PORT, () => {
    console.log(`✅  Application Ready. Running on port ${PORT}`)
})
