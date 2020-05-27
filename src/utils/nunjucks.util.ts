import { Environment } from 'nunjucks'

import { asGovUKErrorList } from 'app/filters/asGovUKErrorList.filter'

export const addFilters = (env: Environment): void => {
  env.addFilter('asGovUKErrorList', asGovUKErrorList)
}
