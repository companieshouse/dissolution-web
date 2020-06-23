import ValidationErrors from 'app/models/validationErrors'

export function generateValidationError(key: string, message: string): ValidationErrors {
  return {
    [key]: message
  }
}
