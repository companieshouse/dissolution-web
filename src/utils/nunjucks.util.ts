import { Environment } from 'nunjucks'

import { asGovUKErrorList } from 'app/filters/asGovUKErrorList.filter'
import { asSelectDirectorList } from 'app/filters/asSelectDirectorList.filter'

export const addFilters = (env: Environment): void => {
  env.addFilter('asGovUKErrorList', asGovUKErrorList)
  env.addFilter('asSelectDirectorList', asSelectDirectorList)
}
