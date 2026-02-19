enum OfficerRole {
    LLP_MEMBER = "llp-member",
    DIRECTOR = "director",
    CORPORATE_DIRECTOR = "corporate-director",
    CORPORATE_NOMINEE_DIRECTOR = "corporate-nominee-director",
    JUDICIAL_FACTOR = "judicial-factor",
    LLP_DESIGNATED_MEMBER = "llp-designated-member",
    CORPORATE_LLP_MEMBER = "corporate-llp-member",
    CORPORATE_LLP_DESIGNATED_MEMBER = "corporate-llp-designated-member"
}

export function isCorporateOfficer (role: OfficerRole): boolean {
    return [
        OfficerRole.CORPORATE_DIRECTOR,
        OfficerRole.CORPORATE_NOMINEE_DIRECTOR,
        OfficerRole.CORPORATE_LLP_MEMBER,
        OfficerRole.CORPORATE_LLP_DESIGNATED_MEMBER
    ].includes(role)
}

export default OfficerRole
