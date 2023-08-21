import PiwikConfig from "app/models/piwikConfig"

export function asDirectorSingleMultiConfirmationGoalId (isMultiDirector: boolean, piwikConfig: PiwikConfig): number {
    return isMultiDirector
        ? piwikConfig.multiDirectorConfirmationGoalId : piwikConfig.singleDirectorConfirmationGoalId
}
