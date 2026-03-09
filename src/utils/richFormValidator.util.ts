import FormValidator from "./formValidator.util"
import { ValidationErrorItem } from "@hapi/joi"
import { provide } from "inversify-binding-decorators"
import validationErrorCodeMap from "./validationErrorCodes"

@provide(RichFormValidator)
export default class RichFormValidator extends FormValidator {
    protected mapJoiErrorsToValidationErrors(errors: ValidationErrorItem[]): { [field: string]: { message: string, alt_message: string } } {
        const validationErrors: { [field: string]: { message: string, alt_message: string } } = {}
        for (const error of errors) {
            validationErrors[error.path.join(".")] = {
                message: error.message,
                alt_message: validationErrorCodeMap[error.type] || error.type
            }
        }
        return validationErrors
    }
}
