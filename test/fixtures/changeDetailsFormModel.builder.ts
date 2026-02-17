import ChangeDetailsFormModel from "../../src/models/form/changeDetails.model"

export class ChangeDetailsFormModelBuilder {
    private directorEmail?: string = "director@mail.com"
    private onBehalfName?: string
    private onBehalfEmail?: string
    private _csrf: string = "abc123"

    withDirectorEmail (email?: string): this {
        this.directorEmail = email
        return this
    }

    withOnBehalfName (name: string): this {
        this.onBehalfName = name
        return this
    }

    withOnBehalfEmail (email: string): this {
        this.onBehalfEmail = email
        return this
    }

    withCsrf (csrf: string): this {
        this._csrf = csrf
        return this
    }

    build (): ChangeDetailsFormModel {
        const result: any = { _csrf: this._csrf }
        if (this.directorEmail !== undefined) result.directorEmail = this.directorEmail
        if (this.onBehalfName !== undefined) result.onBehalfName = this.onBehalfName
        if (this.onBehalfEmail !== undefined) result.onBehalfEmail = this.onBehalfEmail
        return result as ChangeDetailsFormModel
    }
}

export function aChangeDetailsFormModel (): ChangeDetailsFormModelBuilder {
    return new ChangeDetailsFormModelBuilder()
}
