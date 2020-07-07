import 'reflect-metadata'

import { provide } from 'inversify-binding-decorators'

import { DefineSignatoryInfoFormModel, SignatorySigning } from 'app/models/form/defineSignatoryInfo.model'
import DirectorToSign from 'app/models/session/directorToSign.model'

@provide(SignatoryService)
export default class SignatoryService {

  public getMinimumNumberOfSignatories(totalSignatories: number, selectedDirector: string): number {
    const isApplicantADirector: boolean = selectedDirector !== 'other'
    const totalActiveDirectors: number = isApplicantADirector ? totalSignatories + 1 : totalSignatories

    const majority: number = Math.floor(((totalActiveDirectors / 2) + 1))

    return isApplicantADirector ? majority - 1 : majority
  }

  public updateSignatoriesWithContactInfo(signatories: DirectorToSign[], contactForm: DefineSignatoryInfoFormModel): void {
    signatories.forEach(signatory => this.updateSignatoryWithContactInfo(signatory, contactForm))
  }

  private updateSignatoryWithContactInfo(signatory: DirectorToSign, contactForm: DefineSignatoryInfoFormModel): void {
    if (contactForm[`isSigning_${signatory.id}`] === SignatorySigning.WILL_SIGN) {
      signatory.email = contactForm[`directorEmail_${signatory.id}`]
      signatory.onBehalfName = undefined
    } else {
      signatory.onBehalfName = contactForm[`onBehalfName_${signatory.id}`]
      signatory.email = contactForm[`onBehalfEmail_${signatory.id}`]
    }
  }
}
