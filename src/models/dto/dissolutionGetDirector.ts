export default interface DissolutionGetDirector {
    officer_id: string
    name: string
    email: string
    approved_at?: string
    on_behalf_name?: string
}

export function isCorporateOfficer (director?: DissolutionGetDirector | null): boolean {
    return !!director?.on_behalf_name && director.on_behalf_name.trim().length > 0
}
