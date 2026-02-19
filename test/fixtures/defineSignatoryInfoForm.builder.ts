import { DefineSignatoryInfoFormModel } from "app/models/form/defineSignatoryInfo.model"

export class DefineSignatoryInfoFormBuilder {
    private form: DefineSignatoryInfoFormModel = {}
    private _csrf: string = "abc123"

    withDirectorEmail (id: string, email: string): DefineSignatoryInfoFormBuilder {
        this.form[`directorEmail_${id}`] = email
        return this
    }

    withOnBehalfName (id: string, name: string): DefineSignatoryInfoFormBuilder {
        this.form[`onBehalfName_${id}`] = name
        return this
    }

    withOnBehalfEmail (id: string, email: string): DefineSignatoryInfoFormBuilder {
        this.form[`onBehalfEmail_${id}`] = email
        return this
    }

    withCsrf (csrf: string): DefineSignatoryInfoFormBuilder {
        this._csrf = csrf
        return this
    }

    build (): DefineSignatoryInfoFormModel {
        return { ...this.form, _csrf: this._csrf }
    }
}

export function aDefineSignatoryInfoForm (): DefineSignatoryInfoFormBuilder {
    return new DefineSignatoryInfoFormBuilder()
}
