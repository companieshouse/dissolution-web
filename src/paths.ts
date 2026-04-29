export const ROOT_URI = "/close-a-company"
export const JOURNEY_PATH_PREFIX = `${ROOT_URI}/:journeyId`

export const HEALTHCHECK_URI = `${ROOT_URI}/healthcheck`

export const BOOTSTRAP_JOURNEY_URI = `${ROOT_URI}/bootstrap-journey`

// Redirection
export const REDIRECT_GATE_URI = `${JOURNEY_PATH_PREFIX}/redirect`
export const PAYMENT_CALLBACK_URI = `${REDIRECT_GATE_URI}/payment-callback`
export const GOV_UK_URI = `https://gov.uk`

// Error
export const NOT_SELECTED_SIGNATORY = `${JOURNEY_PATH_PREFIX}/not-selected-signatory`

// Pages
export const ACCESSIBILITY_STATEMENT_URI = `${ROOT_URI}/accessibility-statement`
export const WHO_TO_TELL_URI = `${ROOT_URI}/who-to-tell`
export const STOP_SCREEN_BANK_ACCOUNT_URI = `${ROOT_URI}/stop-screen-bank-account`
export const SEARCH_COMPANY_URI = `${ROOT_URI}/search-company`
export const VIEW_COMPANY_INFORMATION_URI = `${JOURNEY_PATH_PREFIX}/view-company-information`
export const SELECT_DIRECTOR_URI = `${JOURNEY_PATH_PREFIX}/select-director`
export const SELECT_SIGNATORIES_URI = `${JOURNEY_PATH_PREFIX}/select-signatories-to-sign`
export const DEFINE_SIGNATORY_INFO_URI = `${JOURNEY_PATH_PREFIX}/define-signatory-information`
export const CHECK_YOUR_ANSWERS_URI = `${JOURNEY_PATH_PREFIX}/check-your-answers`
export const ENDORSE_COMPANY_CLOSURE_CERTIFICATE_URI = `${JOURNEY_PATH_PREFIX}/endorse-company-closure-certificate`
export const WAIT_FOR_OTHERS_TO_SIGN_URI = `${JOURNEY_PATH_PREFIX}/wait-for-others-to-sign`
export const CHANGE_DETAILS_URI = `${JOURNEY_PATH_PREFIX}/change-details`
export const APPLICATION_STATUS_URI = `${JOURNEY_PATH_PREFIX}/application-status`
export const APPLICATION_STATUS_SEND_EMAIL_URI = `${APPLICATION_STATUS_URI}/send-email`
export const APPLICATION_STATUS_CHANGE_URI = `${APPLICATION_STATUS_URI}/:signatoryId/change`
export const CERTIFICATE_SIGNED_URI = `${JOURNEY_PATH_PREFIX}/certificate-signed`
export const CERTIFICATE_DOWNLOAD_URI = `${JOURNEY_PATH_PREFIX}/certificate-download`
export const VIEW_FINAL_CONFIRMATION_URI = `${JOURNEY_PATH_PREFIX}/view-final-confirmation`
const PAYMENT_URI = `${JOURNEY_PATH_PREFIX}/payment`
export const PAYMENT_REVIEW_URI = `${PAYMENT_URI}/payment-review`
export const PAY_BY_ACCOUNT_DETAILS_URI = `${PAYMENT_URI}/pay-by-account`
export const PAY_BY_ACCOUNT_CHANGE_PAYMENT_TYPE_URI = `${PAYMENT_URI}/pay-by-account/change-payment-type`
export const HOW_DO_YOU_WANT_TO_PAY_URI = `${PAYMENT_URI}/how-do-you-want-to-pay`
export const PAY_BY_ACCOUNT_URI = `${PAYMENT_URI}/pay-by-account`

export const COMPANY_LOOKUP = "/company-lookup/search?forward=/close-a-company/bootstrap-journey?companyNumber={companyNumber}"

// External
export const CONTACT_US_URI = `${GOV_UK_URI}/find-contact-details-companies-house`
