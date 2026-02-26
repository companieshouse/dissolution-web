import "reflect-metadata"

import { provide } from "inversify-binding-decorators"

import { DirectorToSign } from "app/models/session/directorToSign.model"
import CheckYourAnswersDirector from "app/models/view/checkYourAnswersDirector.model"

@provide(CheckYourAnswersDirectorMapper)
export default class CheckYourAnswersDirectorMapper {

    public mapToCheckYourAnswersDirector (director: DirectorToSign): CheckYourAnswersDirector {
        return {
            name: director.name,
            email: director.email!,
            onBehalfName: director.onBehalfName
        }
    }
}
