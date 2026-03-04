import dashify from "dashify"
import ValidationErrors, { ValidationError } from "app/models/view/validationErrors.model"

export interface GovUKError {
    href: string
    text: string
    attributes?: Record<string, string>
}

function getErrorText(value: string | ValidationError): string {
    if (typeof value === "string") return value
    if (value && typeof value === "object" && typeof value.message === "string") return value.message
    return ""
}

export function asGovUKErrorList(errors: ValidationErrors): GovUKError[] {
    return Object.entries(errors).map(([key, value]) => {
        const text: string = getErrorText(value)
        let attributes: Record<string, string> | undefined = undefined
        if (typeof value === "object" && value !== null && "alt_message" in value && value.alt_message !== undefined) {
            attributes = { "data-alt-text": value.alt_message }
        }
        return {
            href: `#${dashify(key)}`,
            text,
            ...(attributes ? { attributes } : {})
        }
    })
}
