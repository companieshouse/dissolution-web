export const ROOT_URI = '/close-a-company'

export const HEALTHCHECK_URI = `${ROOT_URI}/healthcheck`

// Redirection
export const REDIRECT_GATE_URI = `${ROOT_URI}/redirect`
export const PAYMENT_CALLBACK_URI = `${REDIRECT_GATE_URI}/payment-callback`

// Error
export const ERROR_URI = `${ROOT_URI}/error`
export const NOT_SELECTED_SIGNATORY = `${ROOT_URI}/not-selected-signatory`

// Pages
export const WHO_TO_TELL_URI = `${ROOT_URI}/who-to-tell`
export const SEARCH_COMPANY_URI = `${ROOT_URI}/search-company`
export const VIEW_COMPANY_INFORMATION_URI = `${ROOT_URI}/view-company-information`
export const SELECT_DIRECTOR_URI = `${ROOT_URI}/select-director`
export const SELECT_SIGNATORIES_URI = `${ROOT_URI}/select-signatories-to-sign`
export const DEFINE_SIGNATORY_INFO_URI = `${ROOT_URI}/define-signatory-information`
export const CHECK_YOUR_ANSWERS_URI = `${ROOT_URI}/check-your-answers`
export const ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI = `${ROOT_URI}/endorse-company-closure-certificate`
export const WAIT_FOR_OTHERS_TO_SIGN_URI = `${ROOT_URI}/wait-for-others-to-sign`
export const CERTIFICATE_SIGNED_URI = `${ROOT_URI}/certificate-signed`
export const CERTIFICATE_DOWNLOAD_URI = `${ROOT_URI}/certificate-download`
export const PAYMENT_URI = `${ROOT_URI}/payment`
export const PAYMENT_REVIEW_URI = `${PAYMENT_URI}/payment-review`
export const HOW_DO_YOU_WANT_TO_PAY_URI = `${PAYMENT_URI}/how-do-you-want-to-pay`
export const PAY_BY_ACCOUNT_DETAILS_URI = `${PAYMENT_URI}/pay-by-account`
export const VIEW_FINAL_CONFIRMATION_URI = `${ROOT_URI}/view-final-confirmation`
