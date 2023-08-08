import ClosableCompanyType from "app/models/mapper/closableCompanyType.enum";
import PiwikConfig from "app/models/piwikConfig";

export function asCompanyTypeGoalId (companyType: string, piwikConfig: PiwikConfig): number {
    if (companyType === ClosableCompanyType.LLP) {
        return piwikConfig.partnershipGoalId;
    } else {
        return piwikConfig.limitedCompanyGoalId;
    }
}
