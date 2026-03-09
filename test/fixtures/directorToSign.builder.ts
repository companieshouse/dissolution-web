import { DirectorToSign } from "app/models/session/directorToSign.model"
import OfficerRole from "app/models/dto/officerRole.enum"

export class DirectorToSignBuilder {
    private id: string = "123"
    private name: string = "Bob Smith"
    private isApplicant: boolean = false
    private officerRole: OfficerRole = OfficerRole.DIRECTOR
    private email?: string
    private onBehalfName?: string

    withId (id: string): this {
        this.id = id
        return this
    }

    withName (name: string): this {
        this.name = name
        return this
    }

    asApplicant (): this {
        this.isApplicant = true
        return this
    }

    withOfficerRole (role: OfficerRole): this {
        this.officerRole = role
        return this
    }

    withEmail (email: string): this {
        this.email = email
        return this
    }

    withOnBehalfName (name: string): this {
        this.onBehalfName = name
        return this
    }

    build (): DirectorToSign {
        return {
            id: this.id,
            name: this.name,
            isApplicant: this.isApplicant,
            officerRole: this.officerRole,
            email: this.email,
            onBehalfName: this.onBehalfName
        }
    }
}

export function aDirectorToSign (): DirectorToSignBuilder {
    return new DirectorToSignBuilder()
}
