import { createLogger } from 'ch-logging'
import ApplicationLogger from 'ch-logging/lib/ApplicationLogger'

import { APP_NAME } from 'app/constants/app.const'

let logger: ApplicationLogger

export function loggerInstance(): ApplicationLogger {
    if (!logger) {
        logger = createLogger(APP_NAME)
    }
    return logger
}
