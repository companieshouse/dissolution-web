import { Environment } from 'nunjucks'

import { asGovUKErrorList } from 'app/filters/asGovUKErrorList.filter'
import { asSelectDirectorList } from 'app/filters/asSelectDirectorList.filter'
import * as Paths from 'app/paths'

export const addFilters = (env: Environment): void => {
  env.addFilter('asGovUKErrorList', asGovUKErrorList)
  env.addFilter('asSelectDirectorList', asSelectDirectorList)
}

export const addGlobals = (env: Environment): void => {
  env.addGlobal('Paths', Paths)
}
