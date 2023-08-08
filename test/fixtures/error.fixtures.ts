import ValidationErrors from "app/models/view/validationErrors.model";

export function generateValidationError (key: string, message: string): ValidationErrors {
    return {
        [key]: message
    };
}
