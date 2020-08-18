import 'reflect-metadata'

import { Container } from 'inversify'
import './bootstrap'

import 'app/controllers/index'
import initContainer from 'app/inversify.config'
import Server from 'app/server'

const container: Container = initContainer()

container.get(Server).start(container)
