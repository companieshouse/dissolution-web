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
        return {
            directorEmail: this.directorEmail,
            onBehalfName: this.onBehalfName,
            onBehalfEmail: this.onBehalfEmail,
            _csrf: this._csrf
        }
    }
}

export function aChangeDetailsFormModel (): ChangeDetailsFormModelBuilder {
    return new ChangeDetailsFormModelBuilder()
}
