import DissolutionGetDirector from "app/models/dto/dissolutionGetDirector"

export class DissolutionGetDirectorBuilder {
    private officer_id: string = "director-id-1"
    private name: string = "Singatory Name"
    private email: string = "director@mail.com"
    private approved_at?: string
    private on_behalf_name?: string

    withOfficerId (id: string): this {
        this.officer_id = id
        return this
    }

    withName (name: string): this {
        this.name = name
        return this
    }

    withEmail (email: string): this {
        this.email = email
        return this
    }

    withApprovedAt (approvedAt: string): this {
        this.approved_at = approvedAt
        return this
    }

    withOnBehalfName (onBehalfName: string): this {
        this.on_behalf_name = onBehalfName
        return this
    }

    build (): DissolutionGetDirector {
        return {
            officer_id: this.officer_id,
            name: this.name,
            email: this.email,
            approved_at: this.approved_at,
            on_behalf_name: this.on_behalf_name
        }
    }
}

export function aDissolutionGetDirector (): DissolutionGetDirectorBuilder {
    return new DissolutionGetDirectorBuilder()
}
