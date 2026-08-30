# Dissolution Web - MongoDB Data Journey Map

**Document Structure:** Ordered by user journey. For each step: API calls made, data read/written, and validation rules.

---

## 1. Bootstrap Journey
**Route:** `GET /close-a-company/bootstrap-journey?companyNumber={companyNumber}`
**Controller:** `bootstrapJourney.controller.ts`

| Aspect | Detail |
|--------|--------|
| **API Calls** | None (validates company auth only) |
| **Session Created** | `journeyId` (UUID) + `companyNumber` |
| **Validations** | Company number format; User authorized for company |

---

## 2. View Company Information
**Route:** `GET/POST /close-a-company/{journeyId}/view-company-information`
**Controller:** `viewCompanyInformation.controller.ts`

| Aspect | Detail                                                                                                                                   |
|--------|------------------------------------------------------------------------------------------------------------------------------------------|
| **API Call 1** | `GET /company/{companyNumber}` via `CompanyProfileClient`                                                                                |
| **Backend Service** | `company-profile-api`                                                                                                                    |
| **MongoDB Collection** | `company_profile`                                                                                                                       |
| **Data Retrieved** | Company name, status, type, incorporation date, registered office                                                                        |
| **API Call 2** | `GET /company/{companyNumber}/officers` via `CompanyOfficersClient` (validation only)                                                    |
| **Backend Service** | `company-appointments.api`                                                                                                               |
| **MongoDB Collection** | `appointments.delta_appointments`                                                                                                       |
| **Data Retrieved** | Active officer count (used only to validate > 0)                                                                                         |
| **Validations** | • Company type is closable (not Private/Public/LLP/etc)<br>• Company status = ACTIVE<br>• Not an overseas company<br>• At least 1 active director/member |
| **Error Messages** | • Company type cannot be closed<br>• Company not active<br>• Overseas company<br>• No active directors/members                           |
| **Session Updated** | `companyNumber`, `officerType` (DIRECTOR or MEMBER)                                                                                      |
| **On Submit (POST)** | Redirects to redirect gate to continue journey routing |

---

## 3. Which [Director/Member] are you?
**Route:** `GET/POST /close-a-company/{journeyId}/select-director`
**Controller:** `selectDirector.controller.ts`

| Aspect | Detail |
|--------|----|
| **API Call** | `GET /company/{companyNumber}/officers` via `CompanyOfficersClient` |
| **Backend Service** | `company-appointments.api` |
| **MongoDB Collection** | `appointments.delta_appointments` |
| **Data Retrieved** | Active directors list: `officer_id`, `name`, `role` |
| **User Input** | `director`: Select which director is signing (or "someone else") |
| **Special Cases** | If director is corporate (acting "on behalf of"), capture `onBehalfName` |
| **Session Updated** | `selectDirectorForm`, `directorsToSign[]`, `isMultiDirector`, `isApplicantADirector` |
| **Routing** | • 1 director only + selected = → Check Answers<br>• 1 director + not selected = → Define Signatory<br>• 2+ directors = → Select Signatories |

---

## 4. Select Signatories (Multi-director only)
**Route:** `GET/POST /close-a-company/{journeyId}/select-signatories-to-sign`
**Controller:** `selectSignatories.controller.ts`

| Aspect | Detail |
|--------|--------|
| **Data Needed** | Active directors from step 3 |
| **User Input** | Select which directors will sign the certificate |
| **Validations** | At least 1 director selected; Cannot exceed total active count |
| **Session Updated** | `selectSignatoriesForm`, `directorsToSign[]` (selected signatories; email is collected in step 5) |

---

## 5. Define Signatory Information
**Route:** `GET/POST /close-a-company/{journeyId}/define-signatory-information`
**Controller:** `defineSignatoryInfo.controller.ts`

| Aspect | Detail |
|--------|--------|
| **Data Needed** | Directors selected in step 3/4 |
| **User Input** | Email address for each signatory (+ `onBehalfName` if corporate) |
| **Validations** | Valid email format; Names not empty if corporate |
| **Session Updated** | `defineSignatoryInfoForm`, `directorsToSign[]` (selected signatories enriched with email and on-behalf details) |

---

## 6. Check Your Answers
**Route:** `GET/POST /close-a-company/{journeyId}/check-your-answers`
**Controller:** `checkYourAnswers.controller.ts`

| Aspect | Detail |
|--------|--------|
| **Data Source** | Session (directors, signatory info collected in steps 3–5) |
| **Rendered** | Summary of all choices for user confirmation before submission |
| **On Submit (POST)** | Clears `isFromCheckAnswers`, triggers dissolution creation (step 7), then redirects via redirect gate |

---

## 7. Create Dissolution Request (Write to Backend)
**Triggered by:** `POST /close-a-company/{journeyId}/check-your-answers`
**API Call:** `POST /dissolution-request/{companyNumber}` via `DissolutionApiClient.createDissolution()`

| Aspect | Detail                                              |
|--------|-----------------------------------------------------|
| **Backend Service** | `dissolution-api`                                   |
| **MongoDB Collection** | `dissolutions`                                      |
| **Request Body** | `directors: [{ officer_id, email, on_behalf_name? }]` |
| **Data Written** | Application document with `directors` array and backend-managed `status`/`ETag` |
| **`active` flag** | Set to `true` on creation. While `true`, the `dissolution-api` will reject any attempt to create a new dissolution for the same company — this remains in effect until CHIPS responds (see Step 14) |
| **Response** | `application_reference_number`, `links`             |
| **Session Updated** | No direct update in this step; `applicationReferenceNumber` is set later by redirect/status checks |

---


## 8. Director Signing
**Emails sent by:** `dissolution-api` backend (triggered when dissolution is created in step 7)

| Aspect | Detail |
|--------|--------|
| **Email trigger** | `dissolution-api` sends signing emails to each signatory on dissolution creation |
| **Signatory flow** | Signatory receives email, follows link back to this service, signs in, and lands at the redirect gate |
| **Redirect gate route** | `GET /close-a-company/{journeyId}/redirect` — routes based on `application_status` + user email |
| **Routing outcomes** | • User has pending approval → `endorse-company-closure-certificate` <br>• User is applicant awaiting others → `wait-for-others-to-sign` <br>• User already signed → `certificate-signed` <br>• User not a signatory → `not-selected-signatory` |
| **Reminder emails** | Applicant can trigger a reminder via `POST /close-a-company/{journeyId}/application-status/send-email` |

---

## 9. Endorse Certificate (Director Approval)
**Route:** `POST /close-a-company/{journeyId}/endorse-company-closure-certificate`
**Controller:** `endorseCompanyClosureCertificate.controller.ts`
**API Call:** `PATCH /dissolution-request/{companyNumber}` via `DissolutionApiClient.patchDissolution()`

| Aspect | Detail                                                                                                                                     |
|--------|--------------------------------------------------------------------------------------------------------------------------------------------|
| **Backend Service** | `dissolution-api`                                                                                                                          |
| **MongoDB Collection** | `dissolutions.data.directors[x].approval` — adds `approval` with fields `user_id`, `ip_address` and `date_time` for the `officer_id` sent) |
| **Request Body** | `{ officer_id, has_approved: true, ip_address }` (`DissolutionPatchRequest`)                                                               |
| **Effect** | Director marked as approved (frontend later identifies signed users via `approved_at` in dissolution response)                             |
| **Note** | `patchDissolutionDirector()` / `PATCH .../directors/{directorId}` is a separate call used only by Change Details to update a signatory's email |

---

## 10. Payment Review
**Route:** `GET/POST /close-a-company/{journeyId}/payment/payment-review`
**Controller:** `paymentReview.controller.ts`
**API Call:** `GET /dissolution-request/{applicationReference}/payment` via `DissolutionApiClient.getDissolutionPaymentUIData()`

| Aspect | Detail |
|--------|--------|
| **Backend Service** | `dissolution-api` |
| **Data Retrieved** | Payment items array with `description`, `amount` (pence), and `available_payment_methods` |
| **Rendered** | Summary of payment fees and total cost |
| **On Submit (POST)** | Routes to `how-do-you-want-to-pay` (if PAY_BY_ACCOUNT feature enabled) or directly to card payment setup (if disabled) |

---

## 11. How Do You Want to Pay?
**Route:** `GET /close-a-company/{journeyId}/payment/how-do-you-want-to-pay` (display form) and `POST` (submit form)
**Controller:** `howDoYouWantToPay.controller.ts`
**API Calls:** None

| Aspect | Detail |
|--------|--------|
| **Data Source** | Session only |
| **User Input** | Payment method selection: ACCOUNT or CARD |
| **Routing on POST** | • ACCOUNT method (feature enabled) -> `GET /close-a-company/{journeyId}/payment/pay-by-account` <br>• CARD (or feature disabled) -> generate credit/debit card payment URL |
| **Session Updated** | `howDoYouWantToPayForm`, `paymentType` (and `paymentStateUUID` when card flow is selected) |

---

## 12. Payment Details (ACCOUNT method only)
**Route:** `GET/POST /close-a-company/{journeyId}/payment/pay-by-account`
**Controller:** `payByAccountDetails.controller.ts`

| Aspect | Detail |
|--------|--------|
| **User Input** | Presenter ID + presenter authentication code |
| **Validations** | Presenter credentials validated via pay-by-account service |
| **Session Updated** | On successful submit, `confirmation` is set; no dedicated pay-by-account form is persisted |

---

## 13. Submit Payment
**Triggered by:**
- Account flow: `POST /close-a-company/{journeyId}/payment/pay-by-account`
- Card flow setup: payment session creation updates `payment_reference` before redirecting to the external payment journey
**API Call:** `PATCH /dissolution-request/{applicationReference}/payment` via `DissolutionApiClient.patchDissolutionPaymentData()`

| Aspect | Detail                                                                                                                                  |
|--------|-----------------------------------------------------------------------------------------------------------------------------------------|
| **Backend Service** | `dissolution-api`                                                                                                                       |
| **MongoDB Collection** | `dissolutions.data.application.status` — update `status` and related payment fields                                                     |
| **Request Body (Account)** | `{ status: PAID, paid_at, payment_method: ACCOUNT, account_number }`                                                                    |
| **Request Body (Card)** | `{ payment_reference }` (reference from payment provider)                                                                               |
| **Note** | Account number is obtained from presenter credentials; presenter credentials are not sent to dissolution-api                            |
| **Effect** | Account flow marks payment as PAID immediately; card flow stores payment reference and later resolves through callback/status redirects |

---

## 14. CHIPS Processing & Outcome (Backend — Asynchronous)
**Triggered by:** `dissolution-api` forwarding the paid application to CHIPS

| Aspect | Detail                                                                                                                                                                                                                             |
|--------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **How applications reach CHIPS** | A cron job runs periodically looking for dissolutions where `submission.status = PENDING` — these are picked up and submitted to CHIPS                                                                                             |
| **What CHIPS does** | Runs business rules against the submitted application (e.g. `ChangeOfName`, `GapBetweenSignatureAndReceipt`)                                                                                                                       |
| **Possible outcomes** | `ACCEPTED` or `REJECTED`                                                                                                                                                                                                           |
| **On ACCEPTED** | `dissolution-api` sets `active = false` on the dissolution document; application progresses toward closure                                                                                                                         |
| **On REJECTED** | `dissolution-api` sets `active = false`; a refund mechanism is triggered for any payment already made                                                                                                                              |
| **Effect of `active` flag** | Once `active = false` (regardless of outcome) a new dissolution *can* be created for the same company                                                                                                                              |
| **Already-accepted company** | If a new dissolution is created for a company whose previous application was `ACCEPTED` by CHIPS, CHIPS will possibly(tbc) trigger the `D32_3_AlreadyInVoluntaryDissolution` rule, resulting in a rejection of the new application |

---

## 15. Application Status Actions (Change Details / Resend Email)
**Routes:**
- `GET /close-a-company/{journeyId}/application-status/:signatoryId/change`
- `POST /close-a-company/{journeyId}/application-status/send-email`
**Controller:** `applicationStatus.controller.ts`
**API Calls:**
- `GET /dissolution-request/{companyNumber}` (used by resend-email flow to lookup signatory email)
- `POST /dissolution-request/{companyNumber}/resend-email/{directorEmail}` (resend-email flow)

| Aspect | Detail                                                                                                             |
|--------|--------------------------------------------------------------------------------------------------------------------|
| **Backend Service** | `dissolution-api`                                                                                                  |
| **MongoDB Collection** | `dissolutions` (read signatories and payment state fields)                                                         |
| **Purpose** | Lets the applicant start the change-details flow for a signatory or resend signing email while approval is pending |
| **Where status is shown** | Status table is rendered in `wait-for-others-to-sign`, `certificate-signed`, and `not-selected-signatory` pages    |

---

## 16. Certificate Download
**Route:** `GET /close-a-company/{journeyId}/certificate-download`
**Controller:** `certificateDownload.controller.ts`

| Aspect | Detail |
|--------|--------|
| **Backend Service** | `AWS S3` (via `S3Service`) |
| **Data Source** | `certificateBucket` + `certificateKey` from session `confirmation` object |
| **AWS Call** | S3 presigned URL generated from bucket/key |
| **Result** | PDF certificate downloaded |

---

## 17. Final Confirmation
**Route:** `GET /close-a-company/{journeyId}/final-confirmation`
**Controller:** `viewFinalConfirmation.controller.ts`
**API Call:** `GET /dissolution-request/{companyNumber}` via `DissolutionApiClient.getDissolution()`

| Aspect | Detail                                                     |
|--------|------------------------------------------------------------|
| **Backend Service** | `dissolution-api`                                          |
| **MongoDB Collection** | `dissolutions` (read)                                      |
| **Data Shown** | Application reference, completion status, summary          |
| **Session Read** | `applicationReferenceNumber`, `paymentType`, `officerType` |

---

## MongoDB Collections Reference

| Collection                                    | Purpose                       | Created At | Updated At |
|-----------------------------------------------|-------------------------------|------------|------------|
| **`dissolutions`**                            | Main application document     | Step 7 | Steps 9, 13, 14 |
| **`dissolutions.data.directors[x].approval`** | Director approval audit trail | Step 9 | - |
| **`dissolutions.data.application.status`**    | Status tracking               | Step 13 | Steps 13, 14 |

**Key Fields Needed:**
- `application_reference` (unique ID)
- `company_number` (FK to companies)
- `directors[]` with `{ officer_id, email, approved_at?, on_behalf_name? }`
- `application_status` (observed in this service: `pending-approval`, `pending-payment`, `paid`)
- `active` (boolean — `true` from Step 7 until CHIPS responds in Step 14; blocks re-application while `true`)
- `chips_outcome` (set in Step 14: `ACCEPTED` or `REJECTED`)
- `payment_reference` (set during card journey setup)
- `status`, `paid_at`, `payment_method`, `account_number` (set for pay-by-account flow)
- `certificate_bucket`, `certificate_key` (S3 refs)
- `ETag` (for optimistic locking)

---

## Key Validation Rules by Stage

| Stage | Must Be True | Failure Handling |
|-------|-------------|-----------------|
| View Company | Active + has directors + closable type + not overseas | Error modal, no progression |
| Select Directors | Min 1 director selected | Form error, stay on page |
| Select Signatories | Min 1 signatory selected | Form error, stay on page |
| Define Signatory | Valid emails + non-empty names (if corporate) | Form validation, stay on page |
| Payment | Valid payment-type choice and valid presenter credentials for ACCOUNT flow | Form validation, stay on page |

---

## Testing Data Checklist

To recreate a journey for testing:

1. **Company Setup**
   - Company status = ACTIVE
   - Company type = Private/PLC/LLP/etc. (closable)
   - At least 1 active director
   
2. **Directors Setup**
   - Valid email addresses
   - Active appointment (no resignation date)
   
3. **User Authorization**
   - User must be authorized for company
   
4. **Journey Progression**
   - Create `dissolution_request` (Step 7)
   - Mock director approval call (Step 9)
   - Mock payment submission (Step 13)
   - Update `application_status`

5. **Artifacts**
   - Generate or mock certificate PDF
   - Store S3 bucket/key reference in MongoDB
