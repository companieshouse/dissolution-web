import "reflect-metadata"

import { provide } from "inversify-binding-decorators"

import { DefineSignatoryInfoFormModel } from "app/models/form/defineSignatoryInfo.model"
import { DirectorToSign } from "app/models/session/directorToSign.model"

@provide(SignatoryService)
export default class SignatoryService {

    public getMinimumNumberOfSignatories (totalSignatories: number, selectedDirector: string): number {
        const isApplicantADirector: boolean = selectedDirector !== "other"
        const totalActiveDirectors: number = isApplicantADirector ? totalSignatories + 1 : totalSignatories

        const majority: number = Math.floor(((totalActiveDirectors / 2) + 1))

        return isApplicantADirector ? majority - 1 : majority
    }

    public updateSignatoriesWithContactInfo (
        signatories: DirectorToSign[],
        contactForm: DefineSignatoryInfoFormModel
    ): DirectorToSign[] {
        return signatories.map(signatory => this.getUpdatedSignatoryWithContactInfo(signatory, contactForm))
    }

    private getUpdatedSignatoryWithContactInfo (
        signatory: DirectorToSign,
        contactForm: DefineSignatoryInfoFormModel
    ): DirectorToSign {
        const signatoryId: string = signatory.id.toLowerCase()
        const onBehalfName = contactForm[`onBehalfName_${signatoryId}`]
        const onBehalfEmail = contactForm[`onBehalfEmail_${signatoryId}`]
        const directorEmail = contactForm[`directorEmail_${signatoryId}`]

        if (onBehalfName) {
            return {
                ...signatory,
                onBehalfName,
                email: onBehalfEmail ? onBehalfEmail.toLowerCase() : undefined
            }
        }
        if (directorEmail) {
            return {
                ...signatory,
                email: directorEmail.toLowerCase(),
                onBehalfName: undefined
            }
        }
        return signatory
    }
}
