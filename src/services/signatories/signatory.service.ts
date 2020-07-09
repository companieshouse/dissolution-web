import 'reflect-metadata'

import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import SignatoryValidator from './signatory.validator'

import { DefineSignatoryInfoFormModel, SignatorySigning } from 'app/models/form/defineSignatoryInfo.model'
import Optional from 'app/models/optional'
import DirectorToSign from 'app/models/session/directorToSign.model'
import ValidationErrors from 'app/models/view/validationErrors.model'

@provide(SignatoryService)
export default class SignatoryService {

  public constructor(@inject(SignatoryValidator) private validator: SignatoryValidator) {}

  public getMinimumNumberOfSignatories(totalSignatories: number, selectedDirector: string): number {
    const isApplicantADirector: boolean = selectedDirector !== 'other'
    const totalActiveDirectors: number = isApplicantADirector ? totalSignatories + 1 : totalSignatories

    const majority: number = Math.floor(((totalActiveDirectors / 2) + 1))

    return isApplicantADirector ? majority - 1 : majority
  }

  public validateSignatoryInfo(signatories: DirectorToSign[], contactForm: DefineSignatoryInfoFormModel): Optional<ValidationErrors> {
    return this.validator.validateSignatoryInfo(signatories, contactForm)
  }

  public updateSignatoriesWithContactInfo(signatories: DirectorToSign[], contactForm: DefineSignatoryInfoFormModel): void {
    signatories.forEach(signatory => this.updateSignatoryWithContactInfo(signatory, contactForm))
  }

  private updateSignatoryWithContactInfo(signatory: DirectorToSign, contactForm: DefineSignatoryInfoFormModel): void {
    const signatoryId: string = signatory.id.toLowerCase()

    if (contactForm[`isSigning_${signatoryId}`] === SignatorySigning.WILL_SIGN) {
      signatory.email = contactForm[`directorEmail_${signatoryId}`]
      signatory.onBehalfName = undefined
    } else {
      signatory.onBehalfName = contactForm[`onBehalfName_${signatoryId}`]
      signatory.email = contactForm[`onBehalfEmail_${signatoryId}`]
    }
  }
}
