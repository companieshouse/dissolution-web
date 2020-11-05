import Payment from './payment'

export default interface PaymentSummary {
  payments: Payment[]
  total_cost: string
}
