import dashify from "dashify"

import ValidationErrors from "app/models/view/validationErrors.model"

export interface GovUKError {
  href: string
  text: string
}

export function asGovUKErrorList (errors: ValidationErrors): GovUKError[] {
    return Object.entries(errors).map(([key, message]) => ({
        href: `#${dashify(key)}`,
        text: message
    }))
}
