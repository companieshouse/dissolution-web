import "reflect-metadata"

import { Container } from "inversify"
import { Application } from "express"
import "../bootstrap"

import "app/controllers/index"
import initContainer from "app/inversify.config"
import { createInversifyExpressServer } from "app/serverFactory"

const PORT = 3000

const container: Container = initContainer()
const app: Application = createInversifyExpressServer(container)

app.set("port", PORT)

app.listen(PORT, () => {
    console.log(`✅  Application Ready. Running on port ${PORT}`)
})
