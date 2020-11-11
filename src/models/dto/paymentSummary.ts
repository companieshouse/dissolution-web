import PaymentDetails from './paymentDetails'

export default interface PaymentSummary {
  payments: PaymentDetails[]
  total_cost: string
}
