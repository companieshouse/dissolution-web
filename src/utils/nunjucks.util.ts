import { Environment } from 'nunjucks'

import { asCompanyStatusText } from 'app/filters/asCompanyStatusText.filter'
import { asCompanyTypeText } from 'app/filters/asCompanyTypeText.filter'
import { asEmailLabel } from 'app/filters/asEmailLabel.filter'
import { asFormattedDate } from 'app/filters/asFormattedDate.filter'
import { asGovUKErrorList } from 'app/filters/asGovUKErrorList.filter'
import { asSelectDirectorList } from 'app/filters/asSelectDirectorList.filter'
import { asSelectSignatoriesList } from 'app/filters/asSelectSignatoriesList.filter'
import { SignatorySigning } from 'app/models/form/defineSignatoryInfo.model'
import * as Paths from 'app/paths'

export const addFilters = (env: Environment): void => {
  env.addFilter('asGovUKErrorList', asGovUKErrorList)
  env.addFilter('asSelectDirectorList', asSelectDirectorList)
  env.addFilter('asSelectSignatoriesList', asSelectSignatoriesList)
  env.addFilter('asCompanyTypeText', asCompanyTypeText)
  env.addFilter('asCompanyStatusText', asCompanyStatusText)
  env.addFilter('asFormattedDate', asFormattedDate)
  env.addFilter('asEmailLabel', asEmailLabel)
}

export const addGlobals = (env: Environment): void => {
  env.addGlobal('Paths', Paths)
  env.addGlobal('SignatorySigning', SignatorySigning)
}
