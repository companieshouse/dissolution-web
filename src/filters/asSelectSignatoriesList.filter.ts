import DirectorDetails from "app/models/view/directorDetails.model"

export type GovUKCheckbox = {
  value: string
  text: string
  checked: boolean
}

export function asSelectSignatoriesList (signatories: DirectorDetails[], choices?: string[]): GovUKCheckbox[] {
    return signatories.map(signatory => ({
        text: signatory.name,
        value: signatory.id,
        checked: choices?.includes(signatory.id) || false
    }))
}
