import dashify from 'dashify'

import ValidationErrors from 'app/models/validationErrors'

export interface GovUKError {
  href: string
  text: string
}

export function asGovUKErrorList(errors: ValidationErrors): GovUKError[] {
  return Object.entries(errors).map(([key, message]) => ({
    href: `#${dashify(key)}`,
    text: message
  }))
}
