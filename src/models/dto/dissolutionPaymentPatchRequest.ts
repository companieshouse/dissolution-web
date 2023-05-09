import PaymentStatus from './paymentStatus.enum'
import PaymentType from './paymentType.enum'

export default interface DissolutionPaymentPatchRequest {
  status?: PaymentStatus
  payment_reference?: string
  paid_at?: Date
  payment_method?: PaymentType
  account_number?: string
}
