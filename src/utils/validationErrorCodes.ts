const validationErrorCodeMap: { [type: string]: string } = {
    "any.required": "required",
    "string.empty": "empty",
    "string.email": "invalid-email",
    "string.max": "too-long"
}

export default validationErrorCodeMap

