import { AnySchema, ValidationErrorItem, ValidationOptions, ValidationResult } from '@hapi/joi'
import { provide } from 'inversify-binding-decorators'

import Optional from 'app/models/optional'
import ValidationErrors from 'app/models/validationErrors'

@provide(FormValidator)
export default class FormValidator {

  private readonly VALIDATION_OPTIONS: ValidationOptions = {
    abortEarly: false,
    convert: false
  }

  public validate(body: any, schema: AnySchema): Optional<ValidationErrors> {
    const result: ValidationResult = schema.validate(body, this.VALIDATION_OPTIONS)

    if (!result.error) {
      return null
    }
    console.log(JSON.stringify(result.error.details, null, 2))
    return this.mapJoiErrorsToValidationErrors(result.error!.details)
  }

  private mapJoiErrorsToValidationErrors(errors: ValidationErrorItem[]): ValidationErrors {
    return errors.reduce((totalErrors: ValidationErrors, error: ValidationErrorItem) => ({
      ...totalErrors,
      [error.path.join('.')]: error.message
    }), {})
  }
}
