import * as bodyParser from 'body-parser'
import ApplicationLogger from 'ch-logging/lib/ApplicationLogger'
import { Session, SessionMiddleware, SessionStore } from 'ch-node-session-handler'
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey'
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie'
import { Application, NextFunction, Request, Response } from 'express'
import { Container } from 'inversify'
import { buildProviderModule } from 'inversify-binding-decorators'
import { InversifyExpressServer } from 'inversify-express-utils'
import * as nunjucks from 'nunjucks'
import { deepEqual, instance, mock, when } from 'ts-mockito'

import { addFilters } from 'app/utils/nunjucks.util'

import { createSession } from 'test/utils/session/SessionFactory'

// import { getEnvOrThrow } from 'app/utils/env.util'

// tslint:disable-next-line: no-empty
export const createApp = (configureBindings: (container: Container) => void = () => {
}): Application => {
    const container: Container = new Container()
    container.load(buildProviderModule())
    configureBindings(container)

    return new InversifyExpressServer(container)
        .setConfig(server => {

            server.use(bodyParser.json())
            server.use(bodyParser.urlencoded({extended: false}))

            server.set('view engine', 'njk')

            const env: nunjucks.Environment = nunjucks.configure(
                [
                    'src/views',
                    'node_modules/govuk-frontend',
                    'node_modules/govuk-frontend/components',
                ],
                {
                    autoescape: true,
                    express: server
                }
            )

            addFilters(env)
        })
        .build()
}

// tslint:disable-next-line: no-empty
export const createAppWithFakeSession = (configureBindings: (container: Container) => void = () => {
}): Application => {
    return createApp(container => {
        const cookieName = '__SID'
        const cookieSecret = 'ChGovUk-XQrbf3sLj2abFxIY2TlapsJ '

        const session: Session = createSession(cookieSecret)

        const sessionId = session.data[SessionKey.Id]
        const signature = session.data[SessionKey.ClientSig]

        const cookie = Cookie.createFrom(sessionId! + signature)

        const sessionStore = mock(SessionStore)
        when(sessionStore.load(deepEqual(cookie))).thenResolve(session.data)
        const mockSessionStore = instance(sessionStore)

        container.bind(ApplicationLogger).toConstantValue(mock(instance(ApplicationLogger)))
        container.bind(SessionMiddleware).toConstantValue((req: Request, res: Response, next: NextFunction) => {
            req.cookies = {}
            req.cookies[cookieName] = cookie.value
            SessionMiddleware({cookieName, cookieSecret}, mockSessionStore)(req, res, next)
        })

        configureBindings(container)
    })
}