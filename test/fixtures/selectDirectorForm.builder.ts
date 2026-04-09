import SelectDirectorFormModel from "app/models/form/selectDirector.model"

export class SelectDirectorFormModelBuilder {
    private _director?: string = "123"
    private _csrf: string = "abc123"
    private _onBehalfName: Record<string, string|undefined|null> = {}

    withDirector (director?: string): this {
        this._director = director
        return this
    }

    withCsrf (csrf: string): this {
        this._csrf = csrf
        return this
    }

    withOnBehalfName (id: string, name?: string|null): this {
        this._onBehalfName[id] = name
        return this
    }

    build (): SelectDirectorFormModel {
        return {
            director: this._director,
            _csrf: this._csrf,
            ...Object.keys(this._onBehalfName).reduce((acc: Record<string, string|undefined|null>, key) => {
                acc[`onBehalfName_${key}`] = this._onBehalfName[key]
                return acc
            }, {} as Record<string, string>)
        }
    }
}

export function aSelectDirectorFormModel (): SelectDirectorFormModelBuilder {
    return new SelectDirectorFormModelBuilder()
}

