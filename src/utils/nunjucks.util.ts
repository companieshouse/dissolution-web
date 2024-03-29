import { Environment } from "nunjucks"

import { asApplicationTypeConfirmationGoalId } from "app/filters/asApplicationTypeConfirmationGoalId.filter"
import { asCompanyDisplayName } from "app/filters/asCompanyDisplayName"
import { asCompanyStatusText } from "app/filters/asCompanyStatusText.filter"
import { asCompanyTypeGoalId } from "app/filters/asCompanyTypeGoalId.filter"
import { asCompanyTypeText } from "app/filters/asCompanyTypeText.filter"
import { asDirectorSingleMultiConfirmationGoalId } from "app/filters/asDirectorSingleMultiConfirmationGoalId.filter"
import { asEmailLabel } from "app/filters/asEmailLabel.filter"
import { asFormattedDate } from "app/filters/asFormattedDate.filter"
import { asGovUKErrorList } from "app/filters/asGovUKErrorList.filter"
import { asSelectDirectorList } from "app/filters/asSelectDirectorList.filter"
import { asSelectSignatoriesList } from "app/filters/asSelectSignatoriesList.filter"
import PaymentType from "app/models/dto/paymentType.enum"
import SignatorySigning from "app/models/form/signatorySigning.enum"
import * as Paths from "app/paths"

export const addFilters = (env: Environment): void => {
    env.addFilter("asGovUKErrorList", asGovUKErrorList)
    env.addFilter("asSelectDirectorList", asSelectDirectorList)
    env.addFilter("asSelectSignatoriesList", asSelectSignatoriesList)
    env.addFilter("asCompanyTypeText", asCompanyTypeText)
    env.addFilter("asCompanyStatusText", asCompanyStatusText)
    env.addFilter("asFormattedDate", asFormattedDate)
    env.addFilter("asEmailLabel", asEmailLabel)
    env.addFilter("asCompanyDisplayName", asCompanyDisplayName)
    env.addFilter("asCompanyTypeGoalId", asCompanyTypeGoalId)
    env.addFilter("asApplicationTypeConfirmationGoalId", asApplicationTypeConfirmationGoalId)
    env.addFilter("asDirectorSingleMultiConfirmationGoalId", asDirectorSingleMultiConfirmationGoalId)
}

export const addGlobals = (env: Environment): void => {
    env.addGlobal("Paths", Paths)
    env.addGlobal("SignatorySigning", SignatorySigning)
    env.addGlobal("PaymentType", PaymentType)
}
