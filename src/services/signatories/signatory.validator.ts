import 'reflect-metadata'

import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { flatten, groupBy, Dictionary } from 'lodash'

import { DefineSignatoryInfoFormModel, SignatorySigning } from 'app/models/form/defineSignatoryInfo.model'
import Optional from 'app/models/optional'
import DirectorToSign from 'app/models/session/directorToSign.model'
import ValidationErrors from 'app/models/view/validationErrors.model'
import defineSignatoryInfoSchema from 'app/schemas/defineSignatoryInfo.schema'
import FormValidator from 'app/utils/formValidator.util'
import OfficerType from 'app/models/dto/officerType.enum'

interface SignatoryDetails {
  signatoryName: string
  emailValue: string
  emailField: string
}

@provide(SignatoryValidator)
export default class SignatoryValidator {

  public constructor(@inject(FormValidator) private formValidator: FormValidator) {}

  public validateSignatoryInfo(signatories: DirectorToSign[], body: DefineSignatoryInfoFormModel, officerType: OfficerType): Optional<ValidationErrors> {
    const errors: Optional<ValidationErrors> = this.formValidator.validate(body, defineSignatoryInfoSchema(signatories, officerType))
    if (errors) {
      return errors
    }

    return this.validateDuplicateEmailAddresses(signatories, body, officerType)
  }

  private validateDuplicateEmailAddresses(signatories: DirectorToSign[], form: DefineSignatoryInfoFormModel, officerType: OfficerType): Optional<ValidationErrors> {
    const errors: ValidationErrors = this.getDuplicateEmailErrors(signatories, form, officerType)

    return Object.keys(errors).length > 0 ? errors : null
  }

  private getDuplicateEmailErrors(signatories: DirectorToSign[], form: DefineSignatoryInfoFormModel, officerType: OfficerType): ValidationErrors {
    return this.mapToValidationErrors(this.getDuplicateEmailEntries(signatories, form), officerType)
  }

  private getDuplicateEmailEntries(signatories: DirectorToSign[], form: DefineSignatoryInfoFormModel): SignatoryDetails[] {
    const signatoryDetails: SignatoryDetails[] = this.getSignatoryDetails(signatories, form)

    const signatoryDetailsByEmail: Dictionary<SignatoryDetails[]> = groupBy(signatoryDetails, 'emailValue')

    return flatten(Object.values(signatoryDetailsByEmail).filter((details: SignatoryDetails[]) => details.length > 1))
  }

  private getSignatoryDetails(signatories: DirectorToSign[], form: DefineSignatoryInfoFormModel): SignatoryDetails[] {
    return signatories.map(signatory => this.mapToSignatoryDetails(signatory, form))
  }

  private mapToSignatoryDetails(signatory: DirectorToSign, form: DefineSignatoryInfoFormModel): SignatoryDetails {
    const emailField: string = this.getProvidedEmailFieldForSignatory(signatory, form)

    return {
      signatoryName: signatory.name,
      emailField,
      emailValue: form[emailField]
    }
  }

  private getProvidedEmailFieldForSignatory(signatory: DirectorToSign, form: DefineSignatoryInfoFormModel): string {
    const signatoryId: string = signatory.id.toLowerCase()

    return form[`isSigning_${signatoryId}`] === SignatorySigning.WILL_SIGN ?
      `directorEmail_${signatoryId}` : `onBehalfEmail_${signatoryId}`
  }

  private mapToValidationErrors(duplicates: SignatoryDetails[], officerType: OfficerType): ValidationErrors {
    return duplicates.reduce((errors: ValidationErrors, signatory: SignatoryDetails) => ({
      ...errors,
      [signatory.emailField]: this.generateErrorMessage(officerType)
    }), {})
  }

  private generateErrorMessage(officerType: OfficerType): string {
    return `Enter a unique email address for the ${officerType}`
  }
}
