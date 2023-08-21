export interface CompanyStatusList {
    [key: string]: string
}

export const companyStatusList: CompanyStatusList = {
    active: "Active",
    dissolved: "Dissolved",
    liquidation: "Liquidation",
    receivership: "Receiver Action",
    "converted-closed": "Converted / Closed",
    "voluntary-arrangement": "Voluntary Arrangement",
    "insolvency-proceedings": "Insolvency Proceedings",
    administration: "In Administration",
    open: "Open",
    closed: "Closed"
}

export function asCompanyStatusText (companyStatus: string): string {
    return companyStatusList[companyStatus]
}
