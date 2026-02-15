import OfficerRole from "app/models/dto/officerRole.enum"

const CORPORATE_OFFICER_ROLES: Set<string> = new Set<string>([
    OfficerRole.CORPORATE_DIRECTOR,
    OfficerRole.CORPORATE_NOMINEE_DIRECTOR,
    OfficerRole.CORPORATE_LLP_MEMBER,
    OfficerRole.CORPORATE_LLP_DESIGNATED_MEMBER
])

export function isCorporateOfficer (role?: string): boolean {
    if (!role) return false
    return CORPORATE_OFFICER_ROLES.has(role)
}
